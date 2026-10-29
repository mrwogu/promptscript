# EVAL_CODES

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: EVAL\_CODES

> `const` **EVAL\_CODES**: `object`

Defined in: [eval/src/errors.ts:8](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L8)

Codes of eval errors and findings: `PS61xx` datasets, `PS62xx` suites,
`PS63xx` providers and the run, `PS64xx` cache, `PS65xx` cost, `PS66xx` judge,
`PS67xx` reports.

## Type Declaration

### ALLOW\_WITHOUT\_ASSERTION

> `readonly` **ALLOW\_WITHOUT\_ASSERTION**: `"PS6213"` = `'PS6213'`

A dataset allow entry without a deterministic assertion

### ASSERTION\_ERROR

> `readonly` **ASSERTION\_ERROR**: `"PS6214"` = `'PS6214'`

An assertion could not run on a case

### BUDGET\_EXCEEDED

> `readonly` **BUDGET\_EXCEEDED**: `"PS6503"` = `'PS6503'`

The budget does not cover the planned or the next call

### BUDGET\_REQUIRED

> `readonly` **BUDGET\_REQUIRED**: `"PS6504"` = `'PS6504'`

A live cache mode runs without a budget

### CACHE\_ENTRY\_INVALID

> `readonly` **CACHE\_ENTRY\_INVALID**: `"PS6401"` = `'PS6401'`

A cache entry is unreadable or does not match its key; it counts as a miss

### CACHE\_ENTRY\_TOO\_LARGE

> `readonly` **CACHE\_ENTRY\_TOO\_LARGE**: `"PS6405"` = `'PS6405'`

A cache entry is over the 1 MiB read cap, so it is not written

### CACHE\_IO\_FAILED

> `readonly` **CACHE\_IO\_FAILED**: `"PS6404"` = `'PS6404'`

The cache could not be read or written, such as a full disk or a denied directory

### CACHE\_MISS

> `readonly` **CACHE\_MISS**: `"PS6402"` = `'PS6402'`

Replay found no cache entry for a call

### CACHE\_TREE\_INVALID

> `readonly` **CACHE\_TREE\_INVALID**: `"PS6403"` = `'PS6403'`

The cache tree holds something that is not a plain directory or file

### CONFIG\_KEY\_REFUSED

> `readonly` **CONFIG\_KEY\_REFUSED**: `"PS6303"` = `'PS6303'`

`eval.providers` holds a key that is not allowed, such as `apiKey`

### DATASET\_EMPTY

> `readonly` **DATASET\_EMPTY**: `"PS6106"` = `'PS6106'`

Dataset has no rows

### DATASET\_INVALID

> `readonly` **DATASET\_INVALID**: `"PS6101"` = `'PS6101'`

Dataset file cannot be read or parsed, or a row has the wrong shape

### DATASET\_LIMIT

> `readonly` **DATASET\_LIMIT**: `"PS6102"` = `'PS6102'`

Dataset breaks a size or row limit

### JUDGE\_UNSUPPORTED

> `readonly` **JUDGE\_UNSUPPORTED**: `"PS6600"` = `'PS6600'`

The suite has an llm-judge assertion, which this version cannot run

### KEY\_IN\_CONFIG

> `readonly` **KEY\_IN\_CONFIG**: `"PS6307"` = `'PS6307'`

The value of a provider key appears in the eval config

### KEY\_MISSING

> `readonly` **KEY\_MISSING**: `"PS6306"` = `'PS6306'`

The environment variable of a provider key is not set

### MODEL\_REF

> `readonly` **MODEL\_REF**: `"PS6206"` = `'PS6206'`

A model reference does not resolve, is retired or deprecated

### NO\_SCHEMA

> `readonly` **NO\_SCHEMA**: `"PS6205"` = `'PS6205'`

A json-schema assertion has no usable schema

### PATH\_REFUSED

> `readonly` **PATH\_REFUSED**: `"PS6202"` = `'PS6202'`

A path is absolute or leaves the project

### PII\_CARD

> `readonly` **PII\_CARD**: `"PS6113"` = `'PS6113'`

A dataset value holds a payment card number

### PII\_EMAIL

> `readonly` **PII\_EMAIL**: `"PS6112"` = `'PS6112'`

A dataset value holds an email address

### PII\_IBAN

> `readonly` **PII\_IBAN**: `"PS6114"` = `'PS6114'`

A dataset value holds an IBAN

### PRICE\_LOWERED

> `readonly` **PRICE\_LOWERED**: `"PS6505"` = `'PS6505'`

A project price is lower than the built-in price of the same model

### PRICING\_MISSING

> `readonly` **PRICING\_MISSING**: `"PS6501"` = `'PS6501'`

A cost threshold needs a price the catalog does not have

### PROJECT\_INVALID

> `readonly` **PROJECT\_INVALID**: `"PS6310"` = `'PS6310'`

The project config cannot be loaded, or the project does not compile

### PROVIDER\_FAILED

> `readonly` **PROVIDER\_FAILED**: `"PS6300"` = `'PS6300'`

A provider call failed

### PROVIDER\_REJECTED

> `readonly` **PROVIDER\_REJECTED**: `"PS6304"` = `'PS6304'`

A provider refused the request with a 4xx status

### PROVIDER\_UNCONFIGURED

> `readonly` **PROVIDER\_UNCONFIGURED**: `"PS6301"` = `'PS6301'`

A model's provider has no entry in `eval.providers` and no built-in default

### REGEX\_RISK

> `readonly` **REGEX\_RISK**: `"PS6210"` = `'PS6210'`

A regex assertion repeats a group that holds a quantifier

### REPORT\_INVALID

> `readonly` **REPORT\_INVALID**: `"PS6701"` = `'PS6701'`

A report file cannot be read or is not an eval report of this version

### REPORT\_WRITE\_FAILED

> `readonly` **REPORT\_WRITE\_FAILED**: `"PS6702"` = `'PS6702'`

A report directory or file cannot be written

### RESPONSE\_TOO\_LARGE

> `readonly` **RESPONSE\_TOO\_LARGE**: `"PS6305"` = `'PS6305'`

A provider response body is larger than the cap

### ROW\_CONTRACT

> `readonly` **ROW\_CONTRACT**: `"PS6104"` = `'PS6104'`

Row does not fit the prompt contract, or uses a key that is not allowed

### ROW\_ID

> `readonly` **ROW\_ID**: `"PS6103"` = `'PS6103'`

Row id is malformed or used twice

### ROW\_NO\_EXPECTED

> `readonly` **ROW\_NO\_EXPECTED**: `"PS6105"` = `'PS6105'`

An equals assertion has no value and the row has no expected value for it

### RUN\_OPTION\_INVALID

> `readonly` **RUN\_OPTION\_INVALID**: `"PS6309"` = `'PS6309'`

A run option is out of range, such as a concurrency that is not a positive integer

### RUN\_STOPPED

> `readonly` **RUN\_STOPPED**: `"PS6308"` = `'PS6308'`

The run stopped before the case ran

### SCAN\_ERROR

> `readonly` **SCAN\_ERROR**: `"PS6110"` = `'PS6110'`

A validator rule reports an error in a dataset value

### SCAN\_WARNING

> `readonly` **SCAN\_WARNING**: `"PS6111"` = `'PS6111'`

A validator rule reports a warning in a dataset value

### SUITE\_DUPLICATE

> `readonly` **SUITE\_DUPLICATE**: `"PS6201"` = `'PS6201'`

Two suite files have the same name

### SUITE\_INVALID

> `readonly` **SUITE\_INVALID**: `"PS6200"` = `'PS6200'`

Suite file cannot be read, parsed or has the wrong structure

### UNKNOWN\_FIELD

> `readonly` **UNKNOWN\_FIELD**: `"PS6204"` = `'PS6204'`

An assertion reads a field the output contract does not declare

### UNKNOWN\_PROMPT

> `readonly` **UNKNOWN\_PROMPT**: `"PS6203"` = `'PS6203'`

The prompt under test is not compiled by the project

### URL\_REFUSED

> `readonly` **URL\_REFUSED**: `"PS6302"` = `'PS6302'`

A provider URL is refused, or a provider answered with a redirect

### USAGE\_INVALID

> `readonly` **USAGE\_INVALID**: `"PS6502"` = `'PS6502'`

A provider response has no valid token counts