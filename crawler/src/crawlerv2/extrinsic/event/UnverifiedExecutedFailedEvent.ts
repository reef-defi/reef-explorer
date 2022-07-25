import UnverifiedEvmLog from './UnverifiedEvmLog';

class UnverifiedExecutedFailedEvent extends UnverifiedEvmLog {
  method: 'Log' | 'ExecutedFailed' = 'ExecutedFailed';
}

export default UnverifiedExecutedFailedEvent;
