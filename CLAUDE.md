# Project rules

## Docs code blocks

Every fenced code block in `README.md` and `stages/*.md` must end with two empty lines before the closing fence. Pasted blocks then land with gaps between them.

````md
```ts
function example() {}


```
````

## No empty files

Never leave zero-byte files in the repo. Delete any you create, including stray ones from shell redirects. Before finishing a task, check for them (`Get-ChildItem -Recurse -File | Where-Object Length -eq 0`, ignoring `node_modules` and `.git`).
