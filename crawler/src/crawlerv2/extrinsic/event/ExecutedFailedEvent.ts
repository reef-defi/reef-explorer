import EvmLogEvent from './EvmLogEvent';

class ExecutedFailedEvent extends EvmLogEvent {
  method: 'Log' | 'ExecutedFailed' = 'ExecutedFailed';
}

export default ExecutedFailedEvent;
