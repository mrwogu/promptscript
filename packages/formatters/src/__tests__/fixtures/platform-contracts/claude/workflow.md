---
name: audit-routes
description: Audit every route handler for missing auth checks
---

# Audit Routes

const found = await agent('List every .ts file under src/routes/.', {
schema: {
type: 'object',
required: ['files'],
properties: {
files: { type: 'array', items: { type: 'string' } },
},
},
})

const audits = await pipeline(found.files, (file) =>
agent(`Audit ${file} for missing authentication checks.`, { label: file }),
)

return audits.filter(Boolean)
