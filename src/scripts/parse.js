import Ajv from 'ajv';

const ajv = new Ajv({ strict: false });

const script_schema = {
  type: "array",
  additionalItems: {
    type: "string",
  },
  minItems: 1,
  items: [
    {
      type: "object",
      properties: {
        author: { type: "string" },
        name: { type: "string" },
        id: { type: "string" },
      },
      required: [ "name" ],
    },
  ]
};


// TODO validate?
export const parse_script = (list_notation) => {
  let [meta, ...chars] = list_notation.sort();
  return {
    meta,
    chars,
  };
}
