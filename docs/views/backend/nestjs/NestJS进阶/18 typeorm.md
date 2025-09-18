TypeORM 是一个适用于 Node.js 的 ORM（对象关系映射）框架，用于与数据库进行交互。它支持多种数据库系统，包括 MySQL、PostgreSQL、SQLite、MongoDB 等。TypeORM 使得开发者可以使用面向对象的方式来定义和操作数据库中的数据。

+ [mysql2](https://www.npmjs.com/package/mysql2#documentation)
+ [typeorm](https://typeorm.io/)
## 1.安装
```shell
npm install typeorm reflect-metadata mysql2
npm install typescript ts-node @types/node --save-dev
```
## 2. 连接数据库
### 2.1 src\index.ts
src\index.ts
```js
// 从 data-source 模块中导入 AppDataSource
import { AppDataSource } from "./data-source"
// 从 entity/User 模块中导入 User 实体
import { User } from "./entity/User"
// 初始化数据源
AppDataSource.initialize().then(async () => {
// 初始化成功后的操作
// 捕获初始化失败的错误，并输出错误信息
}).catch(error => console.log(error))
.finally(() => process.exit(0))
```
### 2.2 data-source.ts
src\data-source.ts
```js
// 引入 reflect-metadata 库，为 TypeORM 启用反射支持
import "reflect-metadata"
// 从 typeorm 模块中导入 DataSource 类
import { DataSource } from "typeorm"
// 从 ./entity/User 模块中导入 User 实体
import { User } from "./entity/User"
// 创建并导出一个新的 DataSource 实例，配置数据库连接信息
export const AppDataSource = new DataSource({
    type: "mysql",        // 数据库类型为 MySQL
    host: "localhost",    // 数据库主机名
    port: 3306,           // 数据库端口号
    username: "root",     // 数据库用户名
    password: "root",     // 数据库用户密码
    database: "orm",      // 数据库名称
    synchronize: true,    // 是否自动同步实体与数据库表结构
    logging: true,        // 是否启用日志记录
    entities: [User],     // 实体类数组，指定要使用的实体
}
```
### 2.3 User.ts
src\entity\User.ts
```js
// 从 typeorm 模块中导入 Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn 装饰器
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"
// 使用 @Entity 装饰器将 User 类标记为一个数据库表，并指定表名为 "users"
@Entity({
    name: "users"
})
export class User {
    // 使用 @PrimaryGeneratedColumn 装饰器将 id 属性标记为主键并自动生成，并添加注释 "Primary key"
    @PrimaryGeneratedColumn({ comment: "Primary key" })
    id: number
    // 使用 @Column 装饰器将 firstName 属性标记为数据库表中的一列，限制长度为 50
    @Column({ length: 50 })
    firstName: string
    // 使用 @Column 装饰器将 lastName 属性标记为数据库表中的一列，限制长度为 50
    @Column({ length: 50 })
    lastName: string
    // 使用 @Column 装饰器将 age 属性标记为数据库表中的一列，类型为 "int"
    @Column({ type: "int" })
    age: number
    // 使用 @Column 装饰器将 email 属性标记为数据库表中的一列，要求唯一且不允许为空
    @Column({ unique: false, nullable: false })
    email: string
    // 使用 @Column 装饰器将 isActive 属性标记为数据库表中的一列，类型为 "boolean"，默认值为 true
    @Column({ type: "boolean", default: true })
    isActive: boolean
    // 使用 @CreateDateColumn 装饰器将 createdAt 属性标记为创建时间列
    @CreateDateColumn()
    createdAt: Date
    // 使用 @UpdateDateColumn 装饰器将 updatedAt 属性标记为更新时间列
    @UpdateDateColumn()
    updatedAt: Date
}
```
### 2.4 tsconfig.json
tsconfig.json
```json
{
   "compilerOptions": {
      "lib": [
         "es5",
         "es6"
      ],
      "target": "es5",
      "module": "commonjs",
      "moduleResolution": "node",
      "outDir": "./build",
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,
      "sourceMap": true
   }
}
```
## 3.CRUD
| 方法名 | 介绍 |
|--------|------|
| save | 保存一个新的用户或更新一个已有的用户信息。 |
| delete | 删除一个用户。 |
| update | 更新一个已有用户的信息。 |
| insert | 插入多个用户。 |
| remove | 删除一个用户（与 delete 类似）。 |
| findBy | 根据指定条件查找用户。 |
| findAndCount | 查找所有用户并计数。 |
| findOne | 查找一个符合指定条件的用户。 |
| findOneBy | 根据指定条件查找一个用户（与 findOne 类似）。 |
| findOneOrFail | 查找一个符合指定条件的用户，如果未找到则抛出异常。 |

### 3.1 src\index.ts
src\index.ts
```js
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
AppDataSource.initialize().then(async () => {
+    // 保存一个新用户
+    const user = new User()
+    user.firstName = "John"
+    user.lastName = "Doe"
+    user.age = 25
+    user.email = "john.doe@example.com"
+    user.isActive = true
+    await AppDataSource.manager.save(user)
+    console.log("用户已保存: ", user)
+    // 查找一个用户
+    const foundUser = await AppDataSource.manager.findOne(User, { where: { id: user.id } })
+    console.log("找到的用户: ", foundUser)
+    // 更新用户信息
+    if (foundUser) {
+        foundUser.age = 26
+        await AppDataSource.manager.save(foundUser)
+        console.log("用户已更新: ", foundUser)
+    }
+    // 删除用户
+    if (foundUser) {
+        await AppDataSource.manager.remove(foundUser)
+        console.log("用户已删除: ", foundUser)
+    }
+    // 插入多个用户
+    const users = [
+        { firstName: "Alice", lastName: "Smith", age: 30, email: "alice.smith@example.com", +isActive: true },
+        { firstName: "Bob", lastName: "Johnson", age: 35, email: "bob.johnson@example.com", +isActive: true }
+    ]
+    await AppDataSource.manager.insert(User, users)
+    console.log("插入的用户: ", users)
+    // 查找并计数
+    const [allUsers, userCount] = await AppDataSource.manager.findAndCount(User)
+    console.log("所有用户: ", allUsers)
+    console.log("用户总数: ", userCount)
+    // 查找一个用户 (findOne)
+    const singleUser = await AppDataSource.manager.findOne(User, { where: { email: "alice.smith@example.com" } })
+    console.log("查找的用户 (findOne): ", singleUser)
+    // 根据某个条件查找一个用户 (findOneBy)
+    const userByEmail = await AppDataSource.manager.findOneBy(User, { email: "bob.johnson@example.com" })
+    console.log("查找的用户 (findOneBy): ", userByEmail)
+    // 查找一个用户或失败 (findOneOrFail)
+    try {
+        const userOrFail = await AppDataSource.manager.findOneOrFail(User, { where: { email: "nonexistent@example.com" } })
+        console.log("查找的用户 (findOneOrFail): ", userOrFail)
+    } catch (error) {
+        console.log("未找到用户 (findOneOrFail)")
+    }
+}).catch(error => console.log(error))
```
## 4.执行SQL语句
### 4.1 src\index.ts
src\index.ts
```js
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
AppDataSource.initialize().then(async () => {
    await AppDataSource.query(
        `INSERT INTO users (firstName, lastName, age, email, isActive, createdAt, updatedAt)
         VALUES ('John', 'Doe', 25, 'john.doe@example.com', true, NOW(), NOW())`
    )
    console.log("用户已插入")
    const users = await AppDataSource.query(`SELECT * FROM users`)
    console.log("查询到的用户: ", users)
    await AppDataSource.query(
        `UPDATE users SET age = 26 WHERE email = 'john.doe@example.com'`
    )
    console.log("用户已更新")
    await AppDataSource.query(
        `DELETE FROM users WHERE email = 'john.doe@example.com'`
    )
    console.log("用户已删除")
}).catch(error => console.log(error))
```
## 5.createQueryBuilder
### 5.1 queryBuilder
`createQueryBuilder` 是 `TypeORM` 中用于构建和执行复杂 SQL 查询的强大工具。它允许开发者使用一种面向对象的方式来创建 SQL 查询，而不需要直接编写 SQL 语句。`createQueryBuilder` 方法返回一个 `QueryBuilder` 实例，该实例提供了一系列方法来构建查询。

`createQueryBuilder` 方法可以从 `DataSource` 或 `EntityManager` 中调用，用于创建特定实体的查询构建器。例如：
```js
const queryBuilder = AppDataSource.manager.createQueryBuilder(User, "user")
```
在这个示例中，`createQueryBuilder` 方法被用来创建一个针对 User 实体的查询构建器，并将该实体命名为 user。这个查询构建器将用于构建和执行查询。

`QueryBuilder` 的方法

一旦你有了 `QueryBuilder` 实例，就可以使用它提供的各种方法来构建查询。以下是一些常见的方法：

+ `select`: 选择查询中返回的字段。
```js
queryBuilder.select(["user.firstName", "user.lastName"])
```
+ `addSelect`: 添加更多的选择字段。
```js
queryBuilder.addSelect("profile.bio")
```
+ `from`: 指定查询的主表。
```js
queryBuilder.from(User, "user")
```
+ `innerJoin` 和 `leftJoin`: 添加内部连接和左连接。
```js
queryBuilder.innerJoin("user.profile", "profile")
queryBuilder.leftJoin("user.profile", "profile")
```
+ `where`: 添加查询条件。
```js
queryBuilder.where("user.id = :id", { id: 1 })
```
+ `andWhere` 和 `orWhere`: 添加更多的查询条件。
```js
queryBuilder.andWhere("user.isActive = :isActive", { isActive: true })
```
+ `getOne` 和 `getMany`: 执行查询并获取结果。
```js
const user = await queryBuilder.getOne()
const users = await queryBuilder.getMany()
```
+ `delete`: 创建删除查询。
```js
queryBuilder.delete().from(User).where("id = :id", { id: 1 }).execute()
```
### 5.2 src\index.ts
src\index.ts
```js
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
AppDataSource.initialize().then(async () => {
+    // 创建 QueryBuilder 实例
+    const queryBuilder = await AppDataSource.manager.createQueryBuilder()
+    // 使用 QueryBuilder 插入用户
+    await queryBuilder
+        .insert()
+        .into(User)
+        .values([
+            { firstName: "John", lastName: "Doe", age: 25, email: "john.doe@example.com", isActive: true }
+        ])
+        .execute()
+    console.log("用户已插入")
+    // 使用 QueryBuilder 查找用户
+    const users = await queryBuilder
+        .select("user")
+        .from(User, "user")
+        .where("user.firstName = :firstName", { firstName: "John" })
+        .getMany()
+    console.log("查询到的用户: ", users)
+    // 使用 QueryBuilder 更新用户
+    await queryBuilder
+        .update(User)
+        .set({ age: 26 })
+        .where("email = :email", { email: "john.doe@example.com" })
+        .execute()
+    console.log("用户已更新")
+    // 使用 QueryBuilder 删除用户
+    await queryBuilder
+        .delete()
+        .from(User)
+        .where("email = :email", { email: "john.doe@example.com" })
+        .execute()
+    console.log("用户已删除")
}).catch(error => console.log(error))
```
## 6. getRepository
`getRepository` 是 `TypeORM` 中用于访问和操作实体的主要方法之一。它提供了一组便捷的方法来执行常见的数据库操作，如插入、查找、更新和删除
### 6.1 src\index.ts
src\index.ts
```js
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
AppDataSource.initialize().then(async () => {
    // 获取 User 实体的存储库
    const userRepository = AppDataSource.getRepository(User)
    // 插入新用户
    const newUser = new User()
    newUser.firstName = "John"
    newUser.lastName = "Doe"
    newUser.age = 25
    newUser.email = "john.doe@example.com"
    newUser.isActive = true
    await userRepository.save(newUser)
    console.log("用户已插入: ", newUser)
    // 查找所有用户
    const allUsers = await userRepository.find()
    console.log("所有用户: ", allUsers)
    // 查找单个用户
    const user = await userRepository.findOneBy({ id: newUser.id })
    console.log("查找到的用户: ", user)
    // 更新用户
    if (user) {
        user.age = 26
        await userRepository.save(user)
        console.log("用户已更新: ", user)
    }
    // 删除用户
    if (user) {
        await userRepository.remove(user)
        console.log("用户已删除: ", user)
    }
    process.exit(0)
}).catch(error => {
    console.log(error)
    process.exit(1)
})
```
## 7.一对一
### 7.1 @OneToOne
`@OneToOne` 是 TypeORM 中用于定义实体之间一对一关系的装饰器。在一对一关系中，一个实体的每个实例仅与另一个实体的一个实例相关联。这个关系可以是单向的，也可以是双向的。

+ **基本用法**： `@OneToOne` 装饰器用于标记一个实体的属性，表示该属性与另一个实体具有一对一的关系。

+ **参数**：

    + 第一个参数是一个函数，用于返回关系的目标实体类型。
    + 第二个参数是一个可选的对象，用于设置关系的选项（如级联操作、关系的所有权等）。
+ **选项**：

    + `cascade`: 指定是否级联操作。例如，当保存或删除一个实体时，是否自动保存或删除相关的实体。
    eager: 指定是否在查询实体时自动加载相关的实体。
    + `nullable`: 指定该关系是否可以为空。
    + `onDelete`: 指定当相关实体被删除时应该执行的操作（如 CASCADE, SET NULL）。
### 7.2 @JoinColumn
`@JoinColumn` 是 TypeORM 中用于定义实体之间关系的一部分注解，特别是在一对一（OneTo-One）、多对一（Many-to-One）和一对多（One-to-Many）关系中，它用于指定关联实体的外键列。

+ **作用**： @JoinColumn 注解用于指定当前实体和关联实体之间关系的连接列。它通常用于定义外键，并且指定了哪个列将作为外键来建立实体之间的关联。

+ **使用场景**：

    + **一对一关系 (One-to-One)**
    + **多对一关系 (Many-to-One)**
    + **一对多关系 (One-to-Many)**
在这些关系中，@JoinColumn 用于明确指定外键列的名称和配置。

+ **定义关系**：

在 User 实体中，通过 @OneToOne 注解定义了与 Profile 实体的一对一关系。
+ **使用 @JoinColumn**：

    + @JoinColumn 注解放置在 User 实体中的 profile 属性上，表示 User 表中的一个列将作为外键列。
    + 没有指定 @JoinColumn 的参数时，默认的外键列名称将是当前实体属性名加上目标实体的主键列名，比如这里会是 profileId。
+ **外键列的生成**：

    + TypeORM 会在 User 表中自动生成一个外键列，默认名称为 profileId，用于存储关联的 Profile 实体的主键值。
+ **级联操作**：

    + 在 @OneToOne 中，cascade: true 表示在保存 User 时，会自动保存关联的 Profile。
### 7.3 cascade
cascade 选项用于定义在某些操作（如保存、更新、删除）中是否应该自动应用到相关的实体上。当设置 cascade: true 时，表示在对主实体进行操作时，这些操作也会自动应用到相关的实体上。

示例解释：

+ **保存（save）**: 当保存 User 实体时，如果它包含一个新的 Profile 实体，那么 Profile 也会被自动保存。
+ **更新（update）**: 当更新 User 实体时，相关的 Profile 实体也会被自动更新。
+ **删除（remove）**: 当删除 User 实体时，相关的 Profile 实体也会被自动删除。
### 7.4 onDelete
onDelete 选项是一个 SQL 级别的设置，定义了在数据库中当主实体被删除时，相关的外键约束应该执行什么操作。onDelete: "CASCADE" 指定在删除主实体时，相关的外键记录也会被自动删除。

+ `cascade`: true 是一个 TypeORM 级别的选项，管理 ORM 操作时是否自动应用到相关实体上。
+ `onDelete`: "CASCADE" 和 `onUpdate: "CASCADE"` 是数据库级别的选项，定义了在数据库中执行删除或更新操作时，外键约束的行为。
`onDelete` 是一个 SQL 级别的选项，用于定义在删除主实体时，关联的外键记录应该执行的操作。它可以有多个不同的选项，每个选项指定了不同的行为。

常用 `onDelete` 选项

+ **CASCADE**
+ **SET NULL**
+ **RESTRICT**
+ **NO ACTION**
+ **SET DEFAULT**
#### 7.4.1. CASCADE
当主实体被删除时，所有引用该主实体的外键记录也会被自动删除。这种选项适用于当删除一个记录时，也希望删除所有关联的子记录的情况。

+ **示例**：

+ 删除一个用户时，自动删除该用户的所有订单。
```sql
@OneToOne(() => Profile, { onDelete: "CASCADE" })
@JoinColumn()
profile: Profile;
```
#### 7.4.2 SET NULL
当主实体被删除时，所有引用该主实体的外键记录的外键列将被设置为 NULL。这要求外键列必须允许 NULL 值。

示例：

+ 删除一个用户时，将所有个人资料的用户ID设置为 NULL。
```sql
@OneToOne(() => Profile, { onDelete: "SET NULL" })
@JoinColumn()
profile: Profile;
```
#### 7.4.3 RESTRICT
当试图删除主实体时，如果有任何关联的外键记录，则会阻止删除操作。这种选项适用于需要保护关联数据不被意外删除的情况。

示例：

+ 尝试删除一个用户时，如果该用户有个人资料，则阻止删除操作。
```sql
@OneToOne(() => Profile, { onDelete: "RESTRICT" })
@JoinColumn()
profile: Profile;
```
#### 7.4.4 NO ACTION
NO ACTION 的行为与 RESTRICT 类似，表示不采取任何行动，实际效果是在一些数据库中与 RESTRICT 相同。在标准 SQL 中，NO ACTION 意味着在外键约束检查后，不采取任何特殊行动。默认情况下，MySQL 会将其视为 RESTRICT。

示例：

+ 删除一个用户时，如果有个人资料关联到该用户，不采取任何操作（阻止删除）。
```sql
@OneToOne(() => Profile, { onDelete: "NO ACTION" })
@JoinColumn()
profile: Profile;
```
#### 7.4.5. SET DEFAULT
当主实体被删除时，所有引用该主实体的外键记录的外键列将被设置为一个默认值。这要求外键列必须有一个默认值。

示例：

+ 删除一个用户时，将所有个人资料的用户ID设置为预设的默认值。
```sql
@OneToOne(() => Profile, { onDelete: "SET DEFAULT" })
@JoinColumn()
profile: Profile;
```
### 7.5 User.ts
src\entity\User.ts
```js
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm"
import { Profile } from "./Profile"
@Entity()
export class User {
    @PrimaryGeneratedColumn({ comment: "Primary key" })
    id: number
    @Column({ length: 50 })
    firstName: string
    @Column({ length: 50 })
    lastName: string
    @Column({ type: "int" })
    age: number
    @Column({ unique: false, nullable: false })
    email: string
    @Column({ type: "boolean", default: true })
    isActive: boolean
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
+   @OneToOne(() => Profile, profile => profile.user, { cascade: true })
    profile: Profile
}
```
### 7.6 Profile.ts
src\entity\Profile.ts
```js
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm"
import { User } from "./User"
@Entity()
export class Profile {
    @PrimaryGeneratedColumn({ comment: "Primary key" })
    id: number
    @Column({ type: "text" })
    bio: string
    @OneToOne(() => User, user => user.profile, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User
}
```
### 7.7 data-source.ts
src\data-source.ts
```js
import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Profile } from "./entity/Profile"
export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root",
    database: "orm",
    synchronize: true,
    logging: true,
    entities: [User, Profile],
})
```
### 7.8 src\index.ts
src\index.ts
```js
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Profile } from "./entity/Profile"
AppDataSource.initialize().then(async () => {
    // 创建并保存用户和个人资料
    const newUser = new User()
    newUser.firstName = "Jane"
    newUser.lastName = "Doe"
    newUser.age = 28
    newUser.email = "jane.doe@example.com"
    newUser.isActive = true
    const newProfile = new Profile()
    newProfile.bio = "Jane Doe is a software engineer from San Francisco."
    newUser.profile = newProfile
    await AppDataSource.manager.save(newUser)
    console.log("用户和个人资料已保存: ", newUser)
    // 查找用户及其个人资料
    const savedUser = await AppDataSource.manager.findOne(User, {
        where: { id: newUser.id },
        relations: ["profile"],
    })
    console.log("查询到的用户及其个人资料: ", savedUser)
    // 更新用户的个人资料
    if (savedUser && savedUser.profile) {
        savedUser.profile.bio = "Jane Doe is a senior software engineer from San Francisco."
        await AppDataSource.manager.save(savedUser.profile)
        console.log("个人资料已更新: ", savedUser.profile)
    }
    // 删除用户及其个人资料
    if (savedUser) {
        await AppDataSource.manager.remove(savedUser)
        console.log("用户及其个人资料已删除")
    }
    process.exit(0)
}).catch(error => {
    console.log(error)
    process.exit(1)
})
```
### 7.9 一对一queryBuilder
#### 7.9.1 src\index.ts
src\index.ts
```js
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Profile } from "./entity/Profile"
AppDataSource.initialize().then(async () => {
    // 创建并保存用户和个人资料
    const newUser = new User()
    newUser.firstName = "Jane"
    newUser.lastName = "Doe"
    newUser.age = 28
    newUser.email = "jane.doe@example.com"
    newUser.isActive = true
    const newProfile = new Profile()
    newProfile.bio = "Jane Doe is a software engineer from San Francisco."
    newUser.profile = newProfile
    await AppDataSource.manager.save(newUser)
    console.log("用户和个人资料已保存: ", newUser)
    // 使用 createQueryBuilder 查找用户及其个人资料
    const queryBuilder = AppDataSource.manager.createQueryBuilder(User, "user")
    const savedUser = await queryBuilder
        .leftJoinAndSelect("user.profile", "profile")
        .where("user.id = :id", { id: newUser.id })
        .getOne()
    console.log("查询到的用户及其个人资料: ", savedUser)
    // 更新用户的个人资料
    if (savedUser && savedUser.profile) {
        savedUser.profile.bio = "Jane Doe is a senior software engineer from San Francisco."
        await AppDataSource.manager.save(savedUser.profile)
        console.log("个人资料已更新: ", savedUser.profile)
    }
    // 使用 createQueryBuilder 删除用户及其个人资料
    if (savedUser) {
        await AppDataSource.manager.createQueryBuilder()
            .delete()
            .from(User)
            .where("id = :id", { id: savedUser.id })
            .execute()
        console.log("用户及其个人资料已删除")
    }
    process.exit(0)
}).catch(error => {
    console.log(error)
    process.exit(1)
}).finally(() => {
    process.exit(1)
})
```
## 8.一对多和多对一
### 8.1 @OneToMany
基本概念

+ **一对多关系**：一个实体可以拥有多个关联的实体。例如，一个用户可以有多个帖子。这就是用户（User）和帖子（Post）之间的一对多关系。
+ **实体装饰器**：在 TypeORM 中，实体（entity）是数据库表的映射。通过使用装饰器（decorator），我们可以定义实体之间的关系。
定义一对多关系 在一对多关系中，我们需要在“一”方（例如用户）使用 @OneToMany 装饰器，同时在“多”方（例如帖子）使用 @ManyToOne 装饰器。

+ **User 实体**：

    + @OneToMany(() => Post, post => post.user)：
() => Post`：这是关系的目标实体类型。
post => post.user：这是一个函数，表示 Post 实体的 user 属性是关系的一部分。
Post 实体：

    + @ManyToOne(() => User, user => user.posts)：
() => User：这是关系的目标实体类型。
user => user.posts：这是一个函数，表示 User 实体的 posts 属性是关系的一部分。
### 8.2 @ManyToOne
@ManyToOne 是 TypeORM 中用于定义多对一关系的装饰器。

基本概念

+ **多对一关系**：在多对一关系中，多个实体可以关联到同一个实体。例如，多篇帖子可以关联到同一个用户。这就是帖子（Post）和用户（User）之间的多对一关系。
+ **实体装饰器**：在 TypeORM 中，实体（entity）是数据库表的映射。通过使用装饰器（decorator），我们可以定义实体之间的关系。
在多对一关系中，我们需要在“多”方（例如帖子）使用 @ManyToOne 装饰器，同时在“一”方（例如用户）使用 @OneToMany 装饰器。

### 8.3 User.ts
src\entity\User.ts
```js
// 导入必要的模块和类
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
// 导入 Order 实体
import { Order } from "./Order"
// 定义 User 实体类
@Entity()
export class User {
    // 主键字段，自动生成
    @PrimaryGeneratedColumn({ comment: "Primary key" })
    id: number
    // 名字字段，长度为 50
    @Column({ length: 50 })
    firstName: string
    // 姓氏字段，长度为 50
    @Column({ length: 50 })
    lastName: string
    // 年龄字段，类型为整数
    @Column({ type: "int" })
    age: number
    // 邮箱字段，非唯一，不能为空
    @Column({ unique: false, nullable: false })
    email: string
    // 活跃状态字段，类型为布尔值，默认值为 true
    @Column({ type: "boolean", default: true })
    isActive: boolean
    // 创建日期字段，自动生成
    @CreateDateColumn()
    createdAt: Date
    // 更新日期字段，自动生成
    @UpdateDateColumn()
    updatedAt: Date
    // 一对多关系定义，关联到 Order 实体
    @OneToMany(() => Order, order => order.user)
    orders: Order[]
}
```
### 8.4 Order.ts
src\entity\Order.ts
```js
// 导入必要的模块和类
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
// 导入 User 实体
import { User } from "./User"
// 定义 Order 实体类
@Entity()
export class Order {
    // 主键字段，自动生成
    @PrimaryGeneratedColumn({ comment: "Primary key" })
    id: number
    // 产品名称字段，长度为 100
    @Column({ length: 100 })
    product: string
    // 数量字段，类型为整数
    @Column({ type: "int" })
    amount: number
    // 多对一关系定义，关联到 User 实体
    @ManyToOne(() => User, user => user.orders)
    user: User
}
```
### 8.5 src\index.ts
src\index.ts
```js
// 导入必要的数据源和实体类
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Order } from "./entity/Order"
// 初始化数据源并执行数据库操作
AppDataSource.initialize().then(async () => {
    // 创建一个新的用户实例
    const user1 = new User()
    user1.firstName = "John"
    user1.lastName = "Doe"
    user1.age = 25
    user1.email = "john.doe@example.com"
    user1.isActive = true
    // 保存用户到数据库
    await AppDataSource.manager.save(user1)
    // 创建第一个订单并关联到用户
    const order1 = new Order()
    order1.product = "Product A"
    order1.amount = 2
    order1.user = user1
    // 保存第一个订单到数据库
    await AppDataSource.manager.save(order1)
    // 创建第二个订单并关联到用户
    const order2 = new Order()
    order2.product = "Product B"
    order2.amount = 3
    order2.user = user1
    // 保存第二个订单到数据库
    await AppDataSource.manager.save(order2)
    // 创建查询构建器，用于查询用户及其订单总金额
    const queryBuilder = AppDataSource.manager.createQueryBuilder(User, "user")
    const query = queryBuilder
        .select(['user.firstName', 'user.lastName']) // 选择用户的名字和姓氏
        .addSelect('SUM(order.amount)', 'totalAmount') // 选择订单总金额
        .innerJoin('user.orders', 'order') // 内连接用户和订单
        .where('user.isActive = :isActive', { isActive: true }) // 筛选活跃用户
        .andWhere('order.product = :product', { product: 'Product A' }) // 筛选产品为 Product A 的订单
        .groupBy('user.id') // 按用户 ID 分组
        .orderBy('totalAmount', 'DESC') // 按订单总金额降序排序
    // 执行查询并获取结果
    const results = await query.getRawMany()
    // 输出查询结果
    console.log("查询到的用户及其订单总金额: ", results)
    // 退出进程
    process.exit(0)
}).catch(error => {
    // 输出错误信息并退出进程
    console.log(error)
    process.exit(1)
})
```
## 9.多对多
### 9.1 @ManyToMany
`@ManyToMany` 是 TypeORM 中用于定义实体之间多对多关系的装饰器。在多对多关系中，一个实体可以与多个另一个实体关联，反之亦然。例如，一个用户可以有多个角色，一个角色也可以分配给多个用户。

**1. 基本语法**
```js
@ManyToMany(type => AnotherEntity, anotherEntity => anotherEntity.property)
```
+ `type => AnotherEntity`：一个函数，返回要关联的实体类。在这个例子中是 Role。
+ `anotherEntity => anotherEntity.property`：另一个函数，指定关联实体的哪个属性定义了这个关系。在这个例子中是 Role 类中的 users 属性。
### 9.2 @JoinTable
在多对多关系中，至少一侧需要使用 `@JoinTable` 装饰器。这个装饰器表示这个实体是关系的所有者，并且会在数据库中创建一个联结表，用于保存关联信息。

在我们的示例中，`@JoinTable` 放在 User 实体的 roles 属性上，这意味着 User 实体是关系的所有者，联结表将保存用户和角色之间的关系。

### 9.3 User.ts
src\entity\User.ts
```js
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm"
import { Role } from "./Role"
@Entity()
export class User {
    @PrimaryGeneratedColumn({ comment: "Primary key" })
    id: number
    @Column({ length: 50 })
    firstName: string
    @Column({ length: 50 })
    lastName: string
    @Column({ type: "int" })
    age: number
    @Column({ unique: false, nullable: false })
    email: string
    @Column({ type: "boolean", default: true })
    isActive: boolean
    @CreateDateColumn()
    createdAt: Date
    @UpdateDateColumn()
    updatedAt: Date
    @ManyToMany(() => Role, role => role.users)
    @JoinTable()
    roles: Role[]
}
```
### 9.4 Role.ts
src\entity\Role.ts
```js
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm"
import { User } from "./User"
@Entity()
export class Role {
    @PrimaryGeneratedColumn({ comment: "Primary key" })
    id: number
    @Column({ length: 50 })
    name: string
    @ManyToMany(() => User, user => user.roles)
    users: User[]
}
```
### 9.5 index.ts
src\index.ts
```js
import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Role } from "./entity/Role"
AppDataSource.initialize().then(async () => {
    const userRepository = AppDataSource.getRepository(User)
    const roleRepository = AppDataSource.getRepository(Role)
    // 创建新的角色
    const role1 = new Role()
    role1.name = "Admin"
    await roleRepository.save(role1)
    const role2 = new Role()
    role2.name = "User"
    await roleRepository.save(role2)
    // 创建新的用户
    const user = new User()
    user.firstName = "John"
    user.lastName = "Doe"
    user.age = 30
    user.email = "john.doe@example.com"
    user.roles = [role1, role2] // 分配角色
    await userRepository.save(user)
    console.log("User has been saved with roles: ", user)
    process.exit(0)
}).catch(error => {
    console.log(error)
    process.exit(1)
})
```
## 10.树型结构
`@Tree` 是 `TypeORM` 中用于定义树形结构实体的装饰器。树形结构常用于表示层级关系的数据，例如文件目录、组织结构、分类等。TypeORM 提供了多种树形结构来处理不同的场景，如闭包表、嵌套集、物化路径和父子关系。

+` @Tree`：定义树形结构类型。支持 closure-table、nested-set、materialized-path 和 adjacency-list。
+ `@TreeChildren`：定义子节点的属性。
+ `@TreeParent`：定义父节点的属性。

| 方法名 | 介绍 |
|--------|------|
| find | 查询所有目录（或其他条件下的所有实体）。 |
| findTrees | 查询整个树结构，包含所有层级的目录。 |
| findRoots | 查询所有根目录。 |
| findAncestorsTree | 查询特定节点的祖先树，返回包含该节点祖先的完整树结构。 |
| findAncestors | 查询特定节点的所有祖先节点。 |
| findDescendantsTree | 查询特定节点的后代树，返回包含该节点后代的完整树结构。 |
| findDescendants | 查询特定节点的所有后代节点。 |
| countDescendants | 统计特定节点的后代数量。 |
| countAncestors | 统计特定节点的祖先数量。 |

### 10.1 树形结构类型
#### 10.1.1 adjacency-list
`adjacency-list` 是一种表示树形结构的简单且直观的方法。在这种模型中，每个节点记录其直接父节点的信息，通过这种方式可以表示出层级关系。这种方法实现简单，适合插入和删除操作频繁的场景。

在 `adjacency-list` 模型中，每个节点有一个引用，指向其父节点。通过这种引用，可以构建出树形结构。

**优点**：

+ 实现简单，易于理解。
+ 插入和删除操作高效，只需更新少量节点。
**缺点**：

+ 查询效率低。特别是查询整个树结构或计算某节点的所有祖先或后代时，需要多次递归查询。
+ 适合层级关系较浅的数据结构，不适合层级较深且需要频繁查询的场景。
#### 10.1.2 nested-set
`nested-set` 是一种表示树形结构的技术，通过在节点上存储左右值来表示层级关系。这种方法非常适合进行层级数据的查询，特别是在需要频繁读取层级数据的情况下。 在 nested-set 模型中，每个节点都有两个额外的属性：left 和 right。这些属性表示节点在树中的位置。具体来说：

+ `left`：节点的左值，表示进入节点的边界。
+ `right`：节点的右值，表示离开节点的边界。
树的根节点的 left 是 1，right 是树中最大值。每个节点的 left 和 right 值都大于其所有子节点的 left 和 right 值。

优缺点
**优点**：

+ 查询效率高。可以通过简单的条件查询获取整个子树或特定节点的所有祖先。
+ 适合需要频繁读取层级数据的场景。
**缺点**：

插入和删除操作复杂。需要重新计算并更新相关节点的 left 和 right 值。
更新操作会导致大量的写操作。
#### 10.1.3 closure-table
closure-table 是一种表示树形结构的技术，通过维护一个额外的闭包表来存储每个节点与其祖先的关系。这种方法适合进行复杂的层级查询，同时保证插入和删除操作的效率。

**优点**：

查询效率高。特别适合需要进行复杂层级查询的场景，如获取所有祖先或后代。
插入和删除操作相对简单。插入节点时，只需要更新相关的闭包表。
**缺点**：

需要维护额外的闭包表，会增加存储开销。
更新操作会涉及到闭包表的多次插入和删除。
#### 10.1.4 materialized-path
materialized-path 是一种表示树形结构的方法，通过在节点上存储路径字符串来表示层级关系。这种方法适合进行插入和删除操作频繁的场景，路径字符串可以快速确定节点的祖先和后代。

**基本概念**

在 materialized-path 模型中，每个节点都有一个额外的属性 path，表示从根节点到当前节点的路径。这个路径通常是通过连接每个节点的 ID 来形成的，例如用斜杠（/）分隔。

**优点**：

插入和删除操作简单。只需要更新当前节点及其后代的路径属性。
可以通过简单的字符串匹配查询获取祖先或后代节点。
**缺点**：

查询深层次的树结构效率较低。
需要额外存储路径信息，增加了一定的存储开销。
### 10.2 Category.ts
src\entity\Category.ts
```js
import { Entity, Tree, TreeChildren, TreeParent, PrimaryGeneratedColumn, Column } from "typeorm"
@Entity()
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    name: string
    @TreeChildren()
    children: Category[]
    @TreeParent()
    parent: Category
}
```
### 10.3 src\index.ts
src\index.ts
```js
import { AppDataSource } from "./data-source"
import { Category } from "./entity/Category";
AppDataSource.initialize().then(async () => {
    const categoryRepository = AppDataSource.getTreeRepository(Category)
    // 创建根目录
    const root = new Category()
    root.name = "Root"
    await categoryRepository.save(root)
    // 创建子目录
    const child1 = new Category()
    child1.name = "Child 1"
    child1.parent = root
    await categoryRepository.save(child1)
    const child2 = new Category()
    child2.name = "Child 2"
    child2.parent = root
    await categoryRepository.save(child2)
    const grandChild = new Category()
    grandChild.name = "Grandchild"
    grandChild.parent = child1
    await categoryRepository.save(grandChild)
    console.log("Categories have been saved")
    // 查询所有目录
    const allCategories = await categoryRepository.find()
    console.log("All categories: ", JSON.stringify(allCategories, null, 2))
    // 查询树结构
    const trees = await categoryRepository.findTrees()
    console.log("Tree structure: ", JSON.stringify(trees, null, 2))
    // 查询根目录
    const roots = await categoryRepository.findRoots()
    console.log("Root categories: ", JSON.stringify(roots, null, 2))
    // 查询祖先树
    const ancestorsTree = await categoryRepository.findAncestorsTree(grandChild)
    console.log("Ancestors tree of Grandchild: ", JSON.stringify(ancestorsTree, null, 2))
    // 查询祖先
    const ancestors = await categoryRepository.findAncestors(grandChild)
    console.log("Ancestors of Grandchild: ", JSON.stringify(ancestors, null, 2))
    // 查询后代树
    const descendantsTree = await categoryRepository.findDescendantsTree(root)
    console.log("Descendants tree of Root: ", JSON.stringify(descendantsTree, null, 2))
    // 查询后代
    const descendants = await categoryRepository.findDescendants(root)
    console.log("Descendants of Root: ", JSON.stringify(descendants, null, 2))
    // 统计后代数量
    const countDescendants = await categoryRepository.countDescendants(root)
    console.log("Number of descendants of Root: ", countDescendants)
    // 统计祖先数量
    const countAncestors = await categoryRepository.countAncestors(grandChild)
    console.log("Number of ancestors of Grandchild: ", countAncestors)
}).catch(error => {
    console.log(error)
    process.exit(1)
}).finally(() => process.exit(0))
```
## 11.数据库迁移
+ [migrations](https://typeorm.io/migrations)
TypeORM 的迁移（Migration）功能允许你在数据库架构变化时有条理地管理和应用这些变化。迁移是开发和生产环境中保持数据库结构同步的一种可靠方法。

迁移是指数据库架构的版本控制。它们允许你：

+ 定义数据库结构的变化（如创建或删除表、添加或修改列）。
+ 将这些变化应用到数据库中。
+ 维护一个有序的数据库版本历史，以便你可以轻松地迁移到特定的版本或回滚到以前的版本。
```shell
npm install ts-node typescript typeorm -g
```
### 11.1 migration:create
`migration:create` 是 TypeORM 提供的一个命令，用于创建一个新的迁移文件。迁移文件包含用于数据库结构变更的代码，例如创建或修改表、添加或删除列等。这在数据库 schema 的版本控制和演进中非常有用。

主要特点和作用

+ **创建迁移文件**：生成一个包含基本模板的迁移文件，你可以在其中添加具体的数据库变更逻辑。
+ **组织变更**：迁移文件使得数据库变更井然有序，易于管理和版本控制。
+ **协作开发**：多个开发者可以分别创建和提交迁移文件，确保数据库变更不会相互冲突。
使用方法

在项目的根目录下运行以下命令，创建一个新的迁移文件：
```shell
npx ts-node ./node_modules/typeorm/cli  migration:create ./src/migrations/init
```
```js
import { MigrationInterface, QueryRunner } from "typeorm";
export class NameOfYourMigration1653428384621 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 在这里编写升级数据库的变更逻辑，例如创建表、添加列等
    await queryRunner.query(``);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // 在这里编写回滚数据库的变更逻辑，撤销 `up` 方法中的操作
    await queryRunner.query(``);
  }
}
```
+ up 方法：定义应用迁移时执行的操作。
+ down 方法：定义回滚迁移时执行的操作。
### 11.2 migration:generate

`migration:generate` 是 TypeORM CLI 提供的一个命令，用于根据当前实体（Entities）和数据库结构之间的差异自动生成迁移文件。这个命令极大地简化了开发过程中的数据库迁移管理工作。

+ `migration:generate` 命令用于自动生成迁移文件，反映实体和数据库之间的变化。
+ 生成的迁移文件包含 up 和 down 方法，分别用于应用和回滚迁移。
+ 使用 migration:generate 命令之前，确保实体定义和数据源配置正确。
+ 运行生成的迁移文件以应用数据库结构的变化。
```shell
npx ts-node ./node_modules/typeorm/cli  migration:generate ./src/migrations/init -d ./src/data-source.ts
```
### 11.3 migration:run
`migration:run` 是 TypeORM 提供的一个命令，用于运行所有未执行的迁移文件，将数据库结构更新到最新的状态。这个命令对于保持数据库模式与应用程序代码之间的一致性非常重要，特别是在团队协作和生产环境中。

+ `migration:run` 命令用于运行所有未执行的迁移文件，以确保数据库结构与应用程序代码保持一致。
+ 在运行 `migration:run` 命令之前，确保 TypeORM CLI 能够正确找到数据源配置。
+ 可以通过配置文件、数据源文件或使用 ts-node 运行 TypeScript 文件来配置 TypeORM CLI。
```shell
npx ts-node ./node_modules/typeorm/cli  migration:run  -d ./src/data-source.ts
```
### 11.4 migration:generate
```shell
npx typeorm-ts-node-esm migration:generate ./src/migrations/addEmail -d ./src/data-source.ts
```
### 11.5 migration:revert
`migration:revert` 是 TypeORM 提供的一个命令，用于撤销（回滚）最后一次运行的迁移。这在开发和测试过程中非常有用，可以让你轻松地回到之前的数据库状态。

+ `migration:revert` 命令用于撤销最后一次运行的迁移，以便回滚数据库结构的变化。
+ 在运行 `migration:revert` 命令之前，确保 TypeORM CLI 能够正确找到数据源配置。
+ 可以通过配置文件、数据源文件或使用 ts-node 运行 `TypeScript` 文件来配置 `TypeORM CLI`。
```shell
npx ts-node ./node_modules/typeorm/cli  migration:revert  -d ./src/data-source.ts
```
### 11.6 npm scripts
```json
{
  "scripts": {
    "start": "ts-node src/index.ts",
    "typeorm":"npx ts-node ./node_modules/typeorm/cli",
    "migration:create": "npm run typeorm -- migration:create ./src/migrations/init",
    "migration:run": "npm run typeorm -- migration:run -d ./src/data-source.ts",
    "migration:generate": "npm run typeorm -- migration:generate ./src/migrations/addEmail -d ./src/data-source.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d ./src/data-source.ts"
  }
}
```