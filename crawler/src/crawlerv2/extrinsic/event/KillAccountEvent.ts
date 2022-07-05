import { ProcessModule } from "../../types";
import DefaultEvent from "./DefaultEvent";

class KillAccountEvent extends DefaultEvent implements ProcessModule { }

export default KillAccountEvent;