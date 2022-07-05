import { ProcessModule } from "../../types";
import DefaultEvent from "./DefaultEvent";

class NativeTransferEvent extends DefaultEvent implements ProcessModule { }

export default NativeTransferEvent;