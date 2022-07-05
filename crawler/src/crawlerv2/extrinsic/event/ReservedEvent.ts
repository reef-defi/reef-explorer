import { ProcessModule } from "../../types";
import DefaultEvent from "./DefaultEvent";

class ReservedEvent extends DefaultEvent implements ProcessModule { }

export default ReservedEvent;
