# oas-to-joi

Create Joi schemas from your Open Api Specification file.

_**Bonus**_: Typescript Types files from the OAS schemas definitions too. 

## How to install
`npm install --save-dev oas-to-joi`

## How to use
### Command Line
```bash
oas-to-joi --oas-file openapi-example.yaml --output path_to_output_directory
```

### Or creating an OasToJoi instance
```typescript
import OasToJoi from "oas-to-joi";
import path from "path";

  // pass the open api file
  const oasFilePath = path.resolve(`${__dirname}/openapi-example.yaml`);
  const outputDirPath = path.resolve(`${__dirname}/my-output-folder`);

  // create OasToJoi object
  const oasToJoi = new OasToJoi({
    fileName: oasFilePath,
    outputDir: outputDirPath,
  });

  // get Joi schemas and validations
  await oasToJoi.dumpJoiSchemas();
  // get Typescript types
  await oasToJoi.dumpTypes();

```
## Validate data using Joi Schemas

```typescript
  import schema from "./output/joi/add-pet.schema";

  const validate = (data) => {
    const result = schema.validate(data, { abortEarly: false });
    console.log(result);
  };

  validate({ name: "Flanki" });
```

## Output
```bash
========================== 
Dumping Joi Files ✨ 
==========================
# -> Pet: 0.52 ms
# -> Category: 0.05 ms
# -> Tag: 0.06 ms
# -> Order: 0.23 ms
# -> User: 0.12 ms
# -> update-pet.schema.ts: 2.04 ms
# -> add-pet.schema.ts: 1.02 ms
# -> place-order.schema.ts: 0.48 ms
# -> create-user.schema.ts: 0.38 ms
# -> update-user.schema.ts: 0.28 ms
# -> category.schema.ts: 0.24 ms
# -> tag.schema.ts: 0.23 ms
# -> pet.schema.ts: 0.24 ms
# -> order.schema.ts: 0.73 ms
# -> user.schema.ts: 0.36 ms
Done (10) Files

=========================== 
Dumping TypeScript Files ✨ 
===========================
# -> Order: 0.40 ms
# -> Customer: 0.09 ms
# -> Address: 0.03 ms
# -> Category: 0.04 ms
# -> User: 0.20 ms
# -> Tag: 0.05 ms
# -> Pet: 0.33 ms
# -> ApiResponse: 0.02 ms
# -> order.type.ts: 0.42 ms
# -> address.type.ts: 0.69 ms
# -> customer.type.ts: 0.88 ms
# -> category.type.ts: 0.55 ms
# -> user.type.ts: 0.58 ms
# -> tag.type.ts: 0.28 ms
# -> pet.type.ts: 0.34 ms
# -> api-response.type.ts: 0.25 ms
Done (8) Files
```

After dump the object you will get two folders with a set of files which represents the OAS file operations and schemas. For example:
```
└──── output
   ├── joi
   │   ├── add-pet.schema.ts
   │   ├── category.schema.ts
   │   ├── create-user.schema.ts
   │   ├── order.schema.ts
   │   ├── pet.schema.ts
   │   ├── place-order.schema.ts
   │   ├── tag.schema.ts
   │   ├── update-pet.schema.ts
   │   ├── update-user.schema.ts
   │   └── user.schema.ts
   └── types
       ├── address.type.ts
       ├── api-response.type.ts
       ├── category.type.ts
       ├── customer.type.ts
       ├── order.type.ts
       ├── pet.type.ts
       ├── tag.type.ts
       └── user.type.ts
```
### Output example
```typescript
//#user.schema.ts
// This file is autogenerated by "oas-to-joi"
import Joi from "joi";

const schema = Joi.object({
  id: Joi.number(),
  username: Joi.string().max(20),
  firstName: Joi.string().min(3).max(20),
  lastName: Joi.string().max(20),
  email: Joi.string().email(),
  password: Joi.string(),
  phone: Joi.string().pattern(/^\d{3}-\d{3}-\d{4}$/),
  userStatus: Joi.number()
});

export default schema;

```
```typescript
//#order.schema.ts
// This file is autogenerated by "oas-to-joi"
import Joi from "joi";

const schema = Joi.object({
  id: Joi.number(),
  petId: Joi.number(),
  quantity: Joi.number(),
  shipDate: Joi.date(),
  status: Joi.string().valid("placed","approved","delivered"),
  complete: Joi.boolean()
});

export default schema;
```

## OAS Data Type Supported
- string
  - format: date & date-time -> joi date type (only default settings) 
  - format: email -> joi email type (only default settings)
  - format: uuid -> joi uuid type (only default settings)
  - format: hostname -> joi hostname (only default settings)
  - format: uri -> joi uri (only default settings)
  - format: byte -> joi base64 (only default setings)
  - format: ipv4 -> ip({ version: ["ipv4"], cidr: "optional" }) (cidr optional by default)
  - format: ipv6 -> ip({ version: ["ipv6"], cidr: "optional" }) (cidr optional by default)
  - pattern -> joi string patter
  - minLength -> joi string min
  - maxLength -> joi string max 
  
- number
- integer
- boolean
- array

## Limitation

- Only support YAML files.
- The YAML file have to be in utf8 encode.
- Doesn't support circular references, for example:
```typescript
// Pet schema file
const schema = Joi.object({
  id: Joi.number(),
  name: Joi.string().required(),
  tags: Joi.array().items(Tag),
});

// Tag schema file
const schema = Joi.object({
  id: Joi.number(),
  name: Joi.string().required(),
  others: Pet,
});
```

In this case, Tags schema has a reference to Pet and Pet also has a reference to Tag.
The workaround is put both together in the same file and modify the export default value.
