import { RecoveryActionType } from './recovery-action-type.enum';

export interface RecoveryActionProps {
  type:           RecoveryActionType;
  descriptionKey: string;
  priority:       number;
}

/**
 * Immutable value object representing a single corrective action
 * prescribed within an adherence recovery plan.
 */
export class RecoveryAction {
  readonly type:           RecoveryActionType;
  readonly descriptionKey: string;
  /** Lower value = higher priority. */
  readonly priority:       number;

  constructor(props: RecoveryActionProps) {
    this.type           = props.type;
    this.descriptionKey = props.descriptionKey;
    this.priority       = props.priority;
  }

  /** Returns a plain-object representation suitable for serialisation. */
  toJSON(): RecoveryActionProps {
    return {
      type:           this.type,
      descriptionKey: this.descriptionKey,
      priority:       this.priority,
    };
  }
}
