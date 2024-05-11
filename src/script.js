import Ajv from 'ajv';

import { tb } from './scripts/tb.js';

const ajv = Ajv({ strict: false });

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

