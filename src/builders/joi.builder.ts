import { OpenAPIV3 } from "openapi-types";
import { IBuilder } from "../interfaces/builder.interface";
import { IParser } from "../interfaces/parser.interface";
import { SourceObject } from "../types/source-object.type";
import { IOHelper } from "../helpers/io.helper";
import { Definitions } from "../types/definitions.type";
import { Utils } from "../utils";
import mergeJoiTpl from "../templates/joi.tpl";
import {
  JoiRefDecorator,
  JoiNumberDecorator,
  JoiNameDecorator,
  JoiValidDecorator,
  JoiRequiredDecorator,
  JoiStringDecorator,
  JoiArrayDecorator,
  JoiArrayRefDecorator,
  JoiBooleanDecorator,
  JoiDateDecorator,
  JoiAllowDecorator,
  JoiDescriptionDecorator,
  JoiExampleDecorator,
  JoiUnknownDecorator,
  JoiAlternativesDecorator,
} from "../decorators/joi";
import { JoiComponent } from "../decorators/components/joi.component";
import { Decorator } from "../decorators/decorator";
import { OASEnum } from "../enums/oas.enum";
import { PerformanceHelper } from "../helpers/performance.helper";
import { Options } from "../types/options.type";

const isReference = (
  param: OpenAPIV3.ReferenceObject | any,
): param is OpenAPIV3.ReferenceObject => {
  return (param as OpenAPIV3.ReferenceObject).$ref !== undefined;
};

interface SchemaInfo {
  description: string;
  required?: boolean;
  schema: any;
  refName: string;
}
interface SchemaProp {
  properties: Record<string, SchemaInfo>;
}

interface Operations {
  [index: string]: {
    method?: string;
    url?: string;
    query?: SchemaProp;
    path?: SchemaProp;
    responses?: SchemaProp;
    body?: SchemaInfo;
  };
}

export class JoiBuilder implements IBuilder {
  data: OpenAPIV3.Document;
  readonly options: Options;
  readonly outputDir: string;
  private CONTENT_TYPE = "application/json";
  protected fileNameExtension = ".js";
  private performanceHelper = new PerformanceHelper();

  constructor(
    readonly parser: IParser,
    options: Options,
  ) {
    this.options = options;
    this.outputDir = `${options.outputDir}/joi`;
    this.parser.load();
    this.data = this.parser.export();
  }

  async dump(): Promise<number> {
    const { operations, schemas } = this.makeDefinitions();
    console.log("operations :>> ", operations);
    console.log("schemas :>> ", schemas);
    return await this.writeFile([...operations, ...schemas]);
  }

  protected makeDefinitions(): Definitions {
    Utils.consoleMessage({
      message: "Getting definitions...",
      underline: true,
    });
    const operationsList: Array<SourceObject> = [];
    const sourceObjectList: Array<SourceObject> = [];

    const operations = this.getOperations(this.data);
    Object.entries(operations).forEach(([operationName, ref]) => {
      const definitions: string[] = [];
      const references: string[] = [];
      // console.log("ref :>> ", ref);
      if (ref.body) {
        const schemaName = ref.body.refName/* + "Body"*/;
        this.addSchema(sourceObjectList, schemaName, ref.body.schema);
        definitions.push(schemaName);
        references.push(schemaName);
      }

      if (ref.query) {
        const schemaName = operationName + "Query";
        this.addSchema(sourceObjectList, schemaName, ref.query);
        definitions.push(schemaName);
        references.push(schemaName);
      }

      if (ref.path) {
        const schemaName = operationName + "Path";
        this.addSchema(sourceObjectList, schemaName, ref.path);
        definitions.push(schemaName);
        references.push(schemaName);
      }

      if (ref.responses) {
        Object.entries(ref.responses.properties).forEach(([code, response]) => {
          if (response.schema?.$ref || response.schema?.properties) {
            const schemaName = operationName + "Response" + code;
            // console.log('response.schema :>> ', response.schema);
            this.addSchema(sourceObjectList, schemaName, response.schema);
            definitions.push(schemaName);
            references.push(schemaName);
          } else {
            console.log("not supported schema :>> ", code, operationName);
          }
        });
      }
      operationsList.push({
        [this.makePath(ref.body?.refName || operationName).name]: {
          refName: ref.body?.refName,
          method: operations[operationName].method,
          path: operations[operationName].url,
          definitions,
          references,
        },
      });
    });

    return { operations: operationsList, schemas: sourceObjectList };
  }

  protected addSchema(
    sourceObjectList: Array<SourceObject>,
    schemaName: string,
    schema: any,
  ) {
    const sourceObjectIsPresent = (name: string) => {
      const index = sourceObjectList.findIndex((item) => {
        return this.getSourceObjectItemName(item) === name;
      });
      return index > -1 ? true : false;
    };
    if (!sourceObjectIsPresent(schemaName)) {
      const sourceObject = this.makeSourceObject(schemaName, schema);
      const { references } = sourceObject[schemaName];
      if (references) {
        references.forEach((item) => {
          if (sourceObjectIsPresent(schemaName)) return;
          const schema = <OpenAPIV3.SchemaObject>(
            this.data.components.schemas[item]
          );
          this.addSchema(sourceObjectList, item, schema);
        });
      }
      if (!sourceObjectIsPresent(schemaName))
        sourceObjectList.push(sourceObject);
    }
    return sourceObjectList;
  }

  protected getSchema(
    contentSchema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
    operationId?: string,
    description?: string,
    required?: boolean,
  ) {
    const { $ref, ...schema } = <
      OpenAPIV3.ReferenceObject & OpenAPIV3.SchemaObject
    >contentSchema;

    let refName: string = null;
    if ($ref || schema["items"]) {
      const ref = $ref || schema["items"]["$ref"];
      if (ref) {
        refName = ref.split("/").pop();
      }
    }
    return {
      refName: refName || operationId,
      schema: refName ? this.data.components.schemas[refName] : schema,
      description,
      required,
    };
  }

  protected getBody(operation: OpenAPIV3.OperationObject) {
    const requestBody = <OpenAPIV3.RequestBodyObject>operation.requestBody;
    if (requestBody) {
      const content = requestBody.content[this.CONTENT_TYPE] || null;
      if (content) {
        return this.getSchema(
          content.schema,
          operation.operationId,
          operation.description,
        );
      }
    }
    return null;
  }

  protected getParameters(operation: OpenAPIV3.OperationObject) {
    const requestParameters = <
      (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]
    >operation.parameters;

    const path: Record<string, SchemaInfo> = {};
    const query: Record<string, SchemaInfo> = {};

    if (requestParameters) {
      requestParameters.forEach((param) => {
        if (isReference(param)) {
          console.log("#ref parameters not supported");
        } else {
          const schema = this.getSchema(
            param.schema,
            operation.operationId,
            param.description,
            param.required,
          );

          if (param.in === "path") {
            path[param.name] = schema;
          } else {
            query[param.name] = schema;
          }
        }
      });
    }
    return {
      query: Object.keys(query).length ? { properties: query } : undefined,
      path: Object.keys(path).length ? { properties: path } : undefined,
    };
  }

  protected getResponses(operation: OpenAPIV3.OperationObject) {
    const requestResponses = operation.responses;
    const properties: Record<string, SchemaInfo> = {};

    if (requestResponses) {
      Object.entries(requestResponses).forEach(([code, response]) => {
        if (isReference(response)) {
          console.log("#ref response not supported");
        } else {
          if (response.content) {
            const content = response.content[this.CONTENT_TYPE] || null;
            if (content) {
              const schema = this.getSchema(
                content.schema,
                operation.operationId,
                response.description,
              );
              properties[code] = schema;
            }
          }
        }
      });
    }
    return Object.keys(properties).length ? { responses: { properties } } : {};
  }

  protected getOperations(data: OpenAPIV3.Document): Operations {
    const operations: Operations = {};

    Object.entries(data.paths).forEach(([urlPath, sc]) => {
      Object.entries(sc).forEach(([method, op]) => {
        const operation = <OpenAPIV3.OperationObject>op;        
        const name = method + urlPath;
        
        const path = this.makePath(name);
        operations[operation.operationId || path.name] = {
          method: method,
          url: urlPath,
          body: this.getBody(operation),
          ...this.getParameters(operation),
          ...this.getResponses(operation),
        };
        // console.log("urlPath :>> ", urlPath);
      });
    });
    return operations;
  }

  protected makeSourceObject(
    name: string,
    schema: OpenAPIV3.SchemaObject,
  ): SourceObject {
    const joiItems: Array<JoiComponent> = [];
    const sourceObject: SourceObject = {
      [name]: {
        definitions: [],
        references: [],
      },
    };

    this.performanceHelper.setMark(name);
    // console.log("schema.properties :>> ", schema);

    if (!schema.properties) {
      let joiComponent = new JoiComponent();
      joiComponent = new JoiUnknownDecorator(joiComponent);
      joiItems.push(joiComponent);
    } else {
      Object.entries(schema.properties).forEach(([propName, def]) => {
        const required = schema.required?.indexOf(propName) >= 0;

        let joiComponent = new JoiComponent();

        joiComponent = new JoiNameDecorator(joiComponent, propName);

        const referenceName = this.getReferenceName(def);
        if (referenceName) {
          def[OASEnum.REF] = referenceName;
          if (
            sourceObject[name].references.findIndex(
              (v) => referenceName === v,
            ) === -1
          )
            sourceObject[name].references.push(referenceName);
        }

        joiComponent = this.getDecoratoryByType(joiComponent, def);
        if (required) joiComponent = new JoiRequiredDecorator(joiComponent);
        if (!isReference(def)) {
          const { example, description } = def;
          if (example)
            joiComponent = new JoiExampleDecorator(joiComponent, example);
          if (description)
            joiComponent = new JoiDescriptionDecorator(
              joiComponent,
              description,
            );
        }
        joiItems.push(joiComponent);
      });
    }

    sourceObject[name].definitions = joiItems.map((item) => item.generate());
    this.performanceHelper.getMeasure(name);
    return sourceObject;
  }

  protected getReferenceName(
    def: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  ): string {
    const ref = def["items"]
      ? def["items"][OASEnum.REF] || null
      : def[OASEnum.REF] || null;
    if (ref) return ref.split("/").pop();
    else return null;
  }

  protected isArrayOfReferences(
    def: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  ): boolean {
    return def["type"] == OASEnum.ARRAY && def["items"][OASEnum.REF];
  }

  protected getDecoratoryByType(
    joiComponent: JoiComponent,
    def: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
  ): JoiComponent {
    const type = def["type"];
    if (type === OASEnum.ARRAY && def["items"]["type"]) {
      joiComponent = new JoiArrayDecorator(joiComponent, [
        this.getDecoratorByPrimitiveType(def["items"], new JoiComponent()),
      ]);
    } else if (type === OASEnum.ARRAY && def["items"][OASEnum.REF]) {
      joiComponent = new JoiArrayRefDecorator(joiComponent, def[OASEnum.REF]);
      // } else if (type === OASEnum.ARRAY && def["items"]) {
      //   console.log('def["items"] :>> ', def["items"]);
      //   if (def[OASEnum.ALL_OF]) {
      //     joiComponent = new JoiAlternativesDecorator(
      //       joiComponent,
      //       "all",
      //       def["items"][OASEnum.ALL_OF],
      //     );
      //   } else if (def[OASEnum.ONE_OF]) {
      //     joiComponent = new JoiAlternativesDecorator(
      //       joiComponent,
      //       "one",
      //       def["items"][OASEnum.ONE_OF],
      //     );
      //   } else if (def[OASEnum.ANY_OF]) {
      //     joiComponent = new JoiAlternativesDecorator(
      //       joiComponent,
      //       "any",
      //       def["items"][OASEnum.ANY_OF],
      //     );
      //   }
      //   joiComponent = new JoiArrayRefDecorator(joiComponent, def[OASEnum.REF]);
    } else if (type === OASEnum.STRING && def[OASEnum.ENUM]) {
      joiComponent = new JoiValidDecorator(
        this.getDecoratorByPrimitiveType(def, joiComponent),
        def["enum"],
      );
    } else if (def[OASEnum.REF]) {
      joiComponent = new JoiRefDecorator(joiComponent, def[OASEnum.REF]);
      // } else if (def[OASEnum.ALL_OF]) {
      //   console.log("def[OASEnum.ALL_OF] :>> ", def[OASEnum.ALL_OF]);
      //   joiComponent = new JoiAlternativesDecorator(
      //     joiComponent,
      //     "all",
      //     def[OASEnum.ALL_OF],
      //   );
      // } else if (def[OASEnum.ONE_OF]) {
      //   console.log("def[OASEnum.ONE_OF] :>> ", def[OASEnum.ONE_OF]);
      //   joiComponent = new JoiAlternativesDecorator(
      //     joiComponent,
      //     "one",
      //     def[OASEnum.ONE_OF],
      //   );
      // } else if (def[OASEnum.ANY_OF]) {
      //   console.log("def[OASEnum.ANY_OF] :>> ", def[OASEnum.ANY_OF]);
      //   joiComponent = new JoiAlternativesDecorator(
      //     joiComponent,
      //     "any",
      //     def[OASEnum.ANY_OF],
      //   );
    } else {
      joiComponent = this.getDecoratorByPrimitiveType(def, joiComponent);
    }

    if (def["nullable"]) {
      joiComponent = new JoiAllowDecorator(joiComponent, [null]);
    }

    return joiComponent;
  }

  protected getDecoratorByPrimitiveType(
    def: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | string,
    joiComponent: JoiComponent,
  ): Decorator {
    const type = def["type"] || def;
    let decorator: Decorator;
    if (OASEnum.NUMBER.includes(type))
      decorator = new JoiNumberDecorator(joiComponent, {
        format: type,
        multiple: def["multiple"],
        min: def["minimum"],
        max: def["maximum"],
      });
    else if (type === OASEnum.BOOLEAN)
      decorator = new JoiBooleanDecorator(joiComponent);
    else if (OASEnum.DATE.includes(type))
      decorator = new JoiDateDecorator(joiComponent);
    else if (def["format"]) {
      if (def["nullable"]) {
        decorator = new JoiAllowDecorator(
          this.getDecoratorByPrimitiveType(def["format"], joiComponent),
          [null],
        );
      } else
        decorator = this.getDecoratorByPrimitiveType(
          def["format"],
          joiComponent,
        );
    } else
      decorator = new JoiStringDecorator(joiComponent, {
        format: def["format"] || type,
        min: def["minLength"],
        max: def["maxLength"],
        pattern: def["pattern"],
        empty: this.options.emptyString,
        nullable: this.options.nullableString,
      });
    return decorator;
  }

  makePath(url: string) {
    const data = url.split("/");
    if (data.length === 1) {
      return {
        name: url,
        method: null,
        path: "components",
      };
    }
    const method = data.shift();
    let name = data.pop();
    if (name?.match(/\{.*\}/)) {
      name = Utils.toKebabCase(data.pop() + name);
    }
    return {
      name,
      method,
      path: data,
    };
  }
  render(item: SourceObject): Array<string> {
   // console.log("render item :>> ", item);
    const itemName = this.getSourceObjectItemName(item);
    const path = this.makePath(itemName);
    const fn = this.makeSchemaFileName(itemName);
   // console.log("this.makePath(itemName) :>> ", path);
    const { definitions, references } = item[itemName];

    const mergedTemplate = mergeJoiTpl({
      references: this.makeReferencesImportStatement(
        references,
        Array.isArray(path.path) ? path.path.length : 0,
      ),
      definitions,
    });

    return [this.makeSchemaFileName(itemName), mergedTemplate];
  }

  protected getSourceObjectItemName(item: SourceObject) {
   // console.log('getSourceObjectItemName item :>> ', item);
    return Object.keys(item)[0];
  }

  protected makeReferencesImportStatement(
    items: Array<string>,
    level: number,
  ): Array<string> {
    const imports = [];
    const path = this.options.nested
      ? new Array(level).fill("..").join("/") + "/components"
      : ".";

    items.forEach((item) => {
      const [name] = this.makeSchemaFileName(item).split(
        this.fileNameExtension,
      );
      // console.log("name :>> ", name);
      imports.push(`import ${item} from "${path}/${name}.js";`);
    });
    return imports;
  }

  protected makeSchemaFileName(value: string) {
    //  console.log("value :>> ", value);
    const name = Utils.toKebabCase(value);
    return `${name}.schema${this.fileNameExtension}`;
  }

  protected async writeFile(data: Array<SourceObject>): Promise<number> {
    Utils.consoleMessage({ message: "Writing files...", underline: true });
    const targetDirectory = this.outputDir;
    IOHelper.createFolder(targetDirectory);
    for (const item of data) {
     // console.log("item :>> ", item);
      const [fileName, content] = this.render(item);
      if(fileName === 'submit.schema.js')
        console.log("content :>> ", content);
      // console.log('filename :>> ', fileName);
      this.performanceHelper.setMark(fileName);
      await IOHelper.writeFile({
        fileName,
        content,
        targetDirectory: this.outputDir,
      });
      this.performanceHelper.getMeasure(fileName);
    }
    return data.length;
  }
}
