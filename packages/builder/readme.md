# Tsx Builder
The builder uses [webpack](https://webpack.js.org/) and TS to compile TsxAir projects

## Usage
`yarn compile` to compile a project from the cli

## Reporting
You can add a reporter, which can log the compilation stages to a database.
the default logger reports graph db (neo4j) were the code structure can de queried as a graph:
```
docker run -d --name db -p 7687:7687
yarn compile --log
```
Additional reporters can be added by changing reporter.ts 