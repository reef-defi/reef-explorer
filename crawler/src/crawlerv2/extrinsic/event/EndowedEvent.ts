import { ProcessModule } from "../../types";
import DefaultEvent from "./DefaultEvent";

class EndowedEvent extends DefaultEvent implements ProcessModule { }

export default EndowedEvent;
