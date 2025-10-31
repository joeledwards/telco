import * as basic from "./basic";
import * as extended from "./extended";
import * as file from "./file";
import * as hex from "./hex";
import { CDRRecord } from "./record";

const encodings = { basic, extended, hex };

export { encodings, file, CDRRecord };
