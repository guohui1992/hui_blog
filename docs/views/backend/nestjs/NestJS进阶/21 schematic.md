Schematics
> 一个现代Web的脚手架库。

## 描述
Schematics 是一种生成器，可以转换现有的文件系统。它们可以创建文件、重构现有文件或移动文件。

与其他生成器（如 Yeoman 或 Yarn Create）不同的是，Schematics 是纯描述性的；在一切准备好提交之前，所有更改都不会应用到实际文件系统中。Schematics 设计上没有副作用。

## 术语表
| 术语 | 描述 |
|------|------|
| Schematics | 一种在现有文件系统上执行描述性代码且无副作用的生成器。 |
| Collection | 一组 Schematics 的元数据列表。可以在集合中通过名称引用 Schematics。 |
| Tool | 使用 Schematics 库的代码。 |
| Tree | 一个包含原始文件系统和一组要应用的更改的暂存区域。 |
| Rule | 一个对 Tree 应用操作的函数。它返回一个新的 Tree，其中包含所有要应用的转换。 |
| Source | 一个从空文件系统创建全新 Tree 的函数。例如，一个文件源可以从磁盘读取文件并为每个文件创建一个创建操作。 |
| Action | 要验证并提交到文件系统或 Tree 的原子操作。Actions 是由 Schematics 创建的。 |
| Sink | 所有 Action 的最终目的地。 |
| Task | 在 Schematics 中执行外部命令或脚本的一种方式。Task 可用于执行诸如安装依赖、运行测试或构建项目的操作。Task 是通过使用 SchematicContext 对象创建的，并且可以在应用 Schematics Tree 之前或之后运行。 |

## 工具
Schematics 是一个库，本身无法独立运行。可以在此 参考 CLI 中找到它，并且可以在 NPM 上以 @angular-devkit/schematics-cli 的形式发布。本文档解释了库的用法和工具 API，但不涉及工具实现本身。

工具负责以下任务：

+ 创建 Schematic 引擎，并传入一个 Collection 和 Schematic 加载器。
+ 理解并遵守 Schematics 的元数据和集合之间的依赖关系。Schematics 可以引用依赖项，工+ 具需要负责满足这些依赖。参考 CLI 使用 NPM 包作为其集合。
+ 创建 Options 对象。Options 可以是任何内容，但 Schematics 可以指定一个应遵守的 JSON Schema。例如，参考 CLI 将参数解析为 JSON 对象并使用集合指定的 Schema 进行验证。
+ Schematics 提供了一些用于验证的 JSON Schema 格式，工具应添加这些格式。这些格式验证路径、HTML 选择器和应用名称。请参阅参考 CLI 了解如何添加这些格式。
使用原始 Tree 调用 Schematics。Tree 应表示文件系统的初始状态。参考 CLI 使用当前目录来实现这一点。
+ 创建一个 Sink，并将 Schematics 的结果提交到该 Sink。库提供了许多 Sink；FileSystemSink 和 DryRunSink 就是例子。
+ 输出库传播的任何日志信息，包括调试信息。

工具 API 由以下部分组成：

### 引擎
`SchematicEngine` 负责加载和构建 `Collection` 和 `Schematics`。在创建引擎时，工具提供一个 `EngineHost` 接口，该接口了解如何通过名称创建 `CollectionDescription`，以及如何创建 `SchematicDescription。`

### Schematics（生成器）
`Schematics` 是生成器，是 Collection 的一部分。

### Collection
一个 `Collection` 是由一个 `collection.json` 文件（在参考 CLI 中）定义的。此 JSON 定义了以下属性：

| 属性名称 | 类型 | 描述 |
|---------|------|------|
| name | string | Collection 的名称。 |
| version | string | 未使用的字段。 |

### Schematic
## 操作符、Sources 和 Rules
`Source` 是一个生成 `Tree` 的生成器；它从无到有创建一个全新的根 `Tree` `。Rule` 是从一个 `Tree` 到另一个 `Tree` 的转换。`Schematic`（在根目录）是一个通常应用于文件系统的 Rule。

### 操作符
`FileOperator` 应用更改到单个 `FileEntry` 并返回一个新的 `FileEntry`。结果遵循以下规则：

+ 如果返回的 `FileEntry` 为 null，将在操作列表中添加一个 `DeleteAction`。
+ 如果路径更改，将在操作列表中添加一个 RenameAction。
+ 如果内容更改，将在操作列表中添加一个 OverwriteAction。
通过 `FileOperator` 无法创建文件。

### 提供的操作符
Schematics 库默认提供了多个 Operator 工厂，涵盖了基本用例：

| FileOperator | 描述 |
|-------------|------|
| contentTemplate<T>(options: T) | 应用内容模板（见 模板化 部分） |
| pathTemplate<T>(options: T) | 应用路径模板（见 模板化 部分） |

### 提供的 Sources
Schematics 库还默认提供了多个 Source 工厂：

| Source | 描述 |
|--------|------|
| empty() | 创建一个返回空 Tree 的 Source。 |
| source(tree: Tree) | 创建一个返回传入的 Tree 作为参数的 Source。 |
| url(url: string) | 从给定的 URL 加载文件列表，并返回一个包含这些文件作为 CreateAction 应用到空 Tree 的 Tree。 |
| apply(source: Source, rules: Rule[]) | 将一组 Rule 应用到 Source 上，并返回结果 Source。 |

### 提供的 Rules
Schematics 库还默认提供了 Rule 工厂：

| Rule | 描述 |
|------|------|
| noop() | 原样返回输入的 Tree。 |
| chain(rules: Rule[]) | 返回一个由其他 Rule 组成的链式 Rule。 |
| forEach(op: FileOperator) | 返回一个对输入 Tree 的每个文件应用操作符的 Rule。 |
| move(root: string) | 将输入中的所有文件移动到子目录。 |
| merge(other: Tree) | 将输入的 Tree 与其他 Tree 合并。 |
| contentTemplate<T>(options: T) | 将内容模板应用到整个 Tree（见模板部分）。 |
| pathTemplate<T>(options: T) | 将路径模板应用到整个 Tree（见模板部分）。 |
| template<T>(options: T) | 同时将路径和内容模板应用到整个 Tree（见模板部分）。 |
| filter(predicate: FilePredicate<boolean>) | 返回包含通过 FilePredicate 的文件的输入 Tree。 |

## 模板化
如上所述，一些函数基于文件模板化系统，它包括路径和内容模板化。

系统根据在 Tree 中加载的文件或其路径内定义的占位符进行操作，并按以下定义用传入 Rule 的值填充这些占位符（即 template<T>(options: T)）。

### 路径模板化
| 占位符 | 描述 |
|--------|------|
| __variable__ | 替换为 variable 的值。 |
| __variable@function__ | 替换为调用 function(variable) 的结果。可以向左链式调用（__variable@function1@function2__ 等）。 |

### 内容模板化
| 占位符 | 描述 |
|--------|------|
| <%= expression %> | 替换为调用给定表达式的结果。这仅支持直接表达式，不支持结构化（for/if/...）JavaScript。 |
| <%- expression %> | 同上，但插入时结果将进行 HTML 转义（即替换 '<' 为 '\<'）。 |
| <% inline code %> | 将给定代码插入到模板结构中，允许插入结构化 JavaScript。 |
| <%# text %> | 注释，会被完全删除。 |

## 示例
### 简单示例
一个简单的 Schematics 示例，它创建一个 "hello world" 文件，并使用一个选项来确定其路径：
```js
import { Tree } from '@angular-devkit/schematics';

export default function MySchematic(options

: any) {
  return (tree: Tree) => {
    tree.create(options.path + '/hi', 'Hello world!');
    return tree;
  };
}
```
从这个示例中可以看到：

该函数从工具接收选项列表。
它返回一个 `Rule`，该 `Rule` 是从 `Tree` 到另一个 `Tree` 的转换。
### 模板化示例
一个简化的 `Schematics` 示例，它创建一个包含新类的文件，并使用一个选项来确定其名称：
```js
// files/__name@dasherize__.ts

export class <%= classify(name) %> {
}
// index.ts

import { strings } from '@angular-devkit/core';
import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  apply,
  branchAndMerge,
  mergeWith,
  template,
  url,
} from '@angular-devkit/schematics';
import { Schema as ClassOptions } from './schema';

export default function (options: ClassOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!options.name) {
      throw new SchematicsException('Option (name) is required.');
    }

    const templateSource = apply(url('./files'), [
      template({
        ...strings,
        ...options,
      }),
    ]);

    return branchAndMerge(mergeWith(templateSource));
  };
}
```
从这个示例中可以看到的其他内容：

1. `strings` 提供了用于 `dasherize` 和 `classify` 等功能的函数。
2. 文件位于与 `index.ts` 相同的根目录中，并被加载到 `Tree` 中。
3. 然后，`template Rule` 根据指定的模板占位符填充内容。为此，它只知道通过选项对象传递给它的变量和函数。
4. 最后，包含新文件的 `Tree` 被合并到运行该 `Schematic` 的项目的现有文件中。