# scanDatasetRow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: scanDatasetRow()

> **scanDatasetRow**(`record`, `options`): [`EvalFindingV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalFindingV1/index.md)[]

Defined in: [eval/src/dataset/scan.ts:129](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/dataset/scan.ts#L129)

Scan the string values of one row (`inputs` and `expected`) with the
validator's security rules (PS005, PS010, PS011, PS012, PS014) and the PII
detectors. A finding names the rule, row id, path and line, never the rule
message, which can quote the value. Rules listed in `allow` are downgraded
to warnings, and they and PII under `allowPii` carry the suite's reason.

## Parameters

### record

[`DatasetRecord`](https://getpromptscript.dev/api-reference/eval/src/interfaces/DatasetRecord/index.md)

Row read by `readDataset`

### options

[`ScanOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ScanOptions/index.md)

Dataset path, allowed patterns and the suite's review decisions

## Returns

[`EvalFindingV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalFindingV1/index.md)[]

Findings in value order, rules before PII