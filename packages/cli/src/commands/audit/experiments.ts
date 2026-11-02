import {
  compareCodeUnits,
  type PromptReleaseExperiment,
  type PromptReleaseLabelEntryV2,
} from '@promptscript/core';
import type { AuditEvent, AuditEventType, AuditExperimentArm } from './events.js';

/** Experiment events of one label file change, in the order the log shows them. */
export interface ExperimentEvents {
  /** `experiment-ended`, by prompt id; they come before the entry events */
  ended: AuditEvent[];
  /** `experiment-started` and `experiment-changed`, by prompt id; they come after */
  startedOrChanged: AuditEvent[];
}

/** The fields every event of the label file shares, for the given type. */
export type EventBase = (type: AuditEventType) => AuditEvent;

type Entries = ReadonlyMap<string, PromptReleaseLabelEntryV2>;

/** Arms as plain objects, so the log never carries more than the three fields. */
export function armsOf(experiment: PromptReleaseExperiment): AuditExperimentArm[] {
  return experiment.arms.map(({ variant, contentHash, weight }) => ({
    variant,
    contentHash,
    weight,
  }));
}

/** The label parser keeps the arms in key order, so equal experiments serialize the same. */
function sameExperiment(a: PromptReleaseExperiment, b: PromptReleaseExperiment): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function withHash(contentHash: string | undefined): { contentHash?: string } {
  return contentHash === undefined ? {} : { contentHash };
}

/** The variant the entry serves after the change, if it is one of the arms that ran. */
function keptVariant(
  experiment: PromptReleaseExperiment,
  after: PromptReleaseLabelEntryV2 | undefined
): { keptVariant?: string } {
  if (after === undefined) return {};
  const kept = experiment.arms.find((arm) => arm.contentHash === after.contentHash);
  return kept === undefined ? {} : { keptVariant: kept.variant };
}

function endedEvent(
  base: EventBase,
  environment: string,
  prompt: string,
  experiment: PromptReleaseExperiment,
  after: PromptReleaseLabelEntryV2 | undefined
): AuditEvent {
  return {
    ...base('experiment-ended'),
    environment,
    prompt,
    experiment: experiment.name,
    arms: armsOf(experiment),
    ...withHash(after?.contentHash),
    ...keptVariant(experiment, after),
  };
}

function startedOrChangedEvent(
  base: EventBase,
  environment: string,
  prompt: string,
  experiment: PromptReleaseExperiment,
  entry: PromptReleaseLabelEntryV2,
  before: PromptReleaseExperiment | undefined
): AuditEvent {
  return {
    ...base(before === undefined ? 'experiment-started' : 'experiment-changed'),
    environment,
    prompt,
    contentHash: entry.contentHash,
    experiment: experiment.name,
    arms: armsOf(experiment),
    ...(before === undefined ? {} : { previousArms: armsOf(before) }),
  };
}

/**
 * Experiment events between the two sides of a label file. A missing side (`previous`
 * undefined, no file, or an entry that is not there) has no experiment, so an experiment of
 * the other side starts or ends. A renamed experiment ends and starts.
 */
export function experimentEvents(
  base: EventBase,
  environment: string,
  previous: Entries | undefined,
  next: Entries,
  configured: { configured?: false }
): ExperimentEvents {
  const result: ExperimentEvents = { ended: [], startedOrChanged: [] };
  const known = previous === undefined ? [] : [...previous.keys()];
  const prompts = [...new Set([...known, ...next.keys()])].sort(compareCodeUnits);
  for (const prompt of prompts) {
    const before = previous?.get(prompt);
    const after = next.get(prompt);
    const was = before?.experiment;
    const now = after?.experiment;
    const sameName = was !== undefined && was.name === now?.name;
    if (was !== undefined && !sameName) {
      result.ended.push({ ...endedEvent(base, environment, prompt, was, after), ...configured });
    }
    if (after === undefined || now === undefined) continue;
    if (sameName && sameExperiment(was, now)) continue;
    const kept = sameName ? was : undefined;
    result.startedOrChanged.push({
      ...startedOrChangedEvent(base, environment, prompt, now, after, kept),
      ...configured,
    });
  }
  return result;
}
