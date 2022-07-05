import { ProcessModule } from "../../types";
import DefaultEvent from "./DefaultEvent";

class StakingEvent extends DefaultEvent implements ProcessModule { }

export default StakingEvent;