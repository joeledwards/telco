import * as basic from "./encodings/basic";
import * as extended from "./encodings/extended";
import * as file from "./file";
import * as hex from "./encodings/hex";
import { CDRRecord } from "./record";

const encodings = { basic, extended, hex };

export { encodings, file, CDRRecord };
