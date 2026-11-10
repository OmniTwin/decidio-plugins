---
name: decidio
description: Looks up the organisation's own decisions, approvals and policies in Decidio (who decided, what applies, and whether it is still in effect) for work whose answer depends on them. Use when the user asks for, or asks Claude to draft, work where their organisation's own rules or past decisions could change the answer, even if they do not mention Decidio - for example accounting and journal entries, capitalising or expensing purchases, spending and approval limits, vendors, contracts and payment terms, customer discounts and refunds, travel and expenses, people processes, IT, security and data handling, and technology choices. Not for general knowledge or explanations, personal matters, or the user's own employment (resigning, pay, complaints, health, their own privacy or job hunting).
---

# Decidio

Decidio is the organisation's record of what was decided or approved, by whom, and whether it still holds. Its tools come from the Decidio connector.

1. Call `get_company_rules_before_answering_or_drafting` with the user's request in their own words and a few `terms` (synonyms, systems, kinds of rule). Before acting on a plan with amounts, call `check_plan_against_company_rules` with the amounts as a table.
2. Apply what is in force. Say when a decision was replaced, retired or is scheduled, and cite record numbers.
3. Bracketed values and "[hidden ...]" markers are protected values: never guess them; the record card shows them to people entitled to see them.
4. A point Decidio does not cover tells you nothing either way; the organisation's other sources apply as they would without it.
5. If the Decidio tools are not available in this conversation, tell the user that Decidio is not connected and that they can connect it from the Decidio plugin's Connectors tab (or Settings, Connectors). Do not guess what their organisation decided.
