1.分类和标签
1.1. contains.ts
src/shared/helpers/contains.ts

export function contains(values, keyword) {
    return values?.includes(keyword);
}
1.2. mapToIds.ts
src/shared/helpers/mapToIds.ts

export function mapToIds(values) {
    return JSON.stringify(values.map(item => item.id));
}
1.3. index.ts
src/shared/helpers/index.ts

export * from './eq';
export * from './range';
export * from './inc';
export * from './dec';
export * from './multiply';
export * from './json';
export * from './def';
+export * from './mapToIds';
+export * from './contains';
1.4. article-detail.hbs
views/article/article-detail.hbs

<h1>
    文章详情
</h1>
<div class="mb-3">
+   <label class="form-label">标题:</label>
+   <p class="form-control-plaintext">{{article.title}}</p>
</div>
<div class="mb-3">
+   <label class="form-label">分类:</label>
+   <p class="form-control-plaintext">
+       {{#each article.categories}}
+       <span class="badge bg-secondary">{{this.name}}</span>
+       {{/each}}
+   </p>
</div>
+<div class="mb-3">
+   <label class="form-label">标签:</label>
+   <p class="form-control-plaintext">
+       {{#each article.tags}}
+       <span class="badge bg-info text-dark">{{this.name}}</span>
+       {{/each}}
+   </p>
+</div>
+<a href="/admin/articles/{{article.id}}/edit" class="btn btn-warning btn-sm">修改</a>
<a href="/admin/articles" class="btn btn-secondary btn-sm">返回列表</a>
1.5. article.entity.ts
src/shared/entities/article.entity.ts

import { ApiProperty } from '@nestjs/swagger';
+import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
+import { Category } from './category.entity';
+import { Tag } from './tag.entity';

@Entity()
export class Article {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: 'ID', example: 1 })
    id: number;

+   @Column({ length: 50, unique: true })
+   @ApiProperty({ description: '标题', example: '文章标题' })
+   title: string;
+
+   @Column('text')
+   @ApiProperty({ description: '内容', example: '文章内容' })
+   content: string;
+
+   @ManyToMany(() => Category)
+   @JoinTable()
+   categories: Category[];
+
+   @ManyToMany(() => Tag)
+   @JoinTable()
+   tags: Tag[];

    @Column({ default: 1 })
    @ApiProperty({ description: '生效状态', example: 1 })
    status: number;

    @Column({ default: 100 })
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;

    @CreateDateColumn()
    @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
    createdAt: Date;

    @UpdateDateColumn()
    @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
    updatedAt: Date;
}

1.6. article.dto.ts
src/shared/dto/article.dto.ts

import { ApiProperty, PartialType as PartialTypeFromSwagger } from '@nestjs/swagger';
+import { IsString, IsInt, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { IdValidators, StatusValidators, SortValidators } from '../decorators/dto.decorator';
+import { Transform } from 'class-transformer';
export class CreateArticleDto {
+   @ApiProperty({ description: '标题', example: '文章标题' })
    @IsString()
+   @MaxLength(50, { message: '标题不能超过50个字符' })
+   title: string;
+
+   @ApiProperty({ description: '内容', example: '文章内容' })
+   content: string;
+
+   @ApiProperty({ description: '分类ID数组', example: [1, 2] })
+   @Transform(({ value }) => Array.isArray(value) ? value.map(Number) : [Number(value)])
+   @IsInt({ each: true })
+   categoryIds: number[];
+
+   @ApiProperty({ description: '标签ID数组', example: [1, 2] })
+   @Transform(({ value }) => Array.isArray(value) ? value.map(Number) : [Number(value)])
+   @IsInt({ each: true })
+   tagIds: number[];

    @StatusValidators()
    @ApiProperty({ description: '状态', example: 1 })
    status: number;

    @SortValidators()
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
}

export class UpdateArticleDto extends PartialTypeFromSwagger(PartialType(CreateArticleDto)) {
    @IdValidators()
    id: number;
}

1.7. article.service.ts
src/shared/services/article.service.ts

+import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Article } from "../entities/article.entity";
+import { Repository, Like, In, UpdateResult } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";
+import { CreateArticleDto, UpdateArticleDto } from "../dto/article.dto";
+import { Category } from "../entities/category.entity";
+import { Tag } from "../entities/tag.entity";

@Injectable()
export class ArticleService extends MySQLBaseService<Article> {
  constructor(
+   @InjectRepository(Article) protected repository: Repository<Article>,
+   @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
+   @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>
  ) {
    super(repository);
  }

  async findAll(keyword?: string) {
    const where = keyword ? [
+     { title: Like(`%${keyword}%`) }
    ] : {};
+   return this.repository.find({ where, relations: ['categories', 'tags'] });
  }

  async findAllWithPagination(page: number, limit: number, keyword?: string) {
    const where = keyword ? [
+     { title: Like(`%${keyword}%`) }
    ] : {};
    const [articles, total] = await this.repository.findAndCount({
      where,
+     relations: ['categories', 'tags'],
      skip: (page - 1) * limit,
      take: limit
    });
    return { articles, total };
  }
+
+ async create(createArticleDto: CreateArticleDto) {
+   const { categoryIds = [], tagIds = [], ...articleData } = createArticleDto;
+   const article = this.repository.create(articleData);
+   article.categories = await this.categoryRepository.findBy({ id: In(categoryIds) });
+   article.tags = await this.tagRepository.findBy({ id: In(tagIds) });
+   return await this.repository.save(article);
+ }
+
+ async update(id: number, updateArticleDto: UpdateArticleDto) {
+   const { categoryIds, tagIds, ...articleData } = updateArticleDto;
+   const article = await this.repository.findOne({ where: { id }, relations: ['categories', 'tags'] });
+   if (!article) throw new NotFoundException('Article not found');
+   Object.assign(article, articleData);
+   if (categoryIds) {
+     article.categories = await this.categoryRepository.findBy({ id: In(categoryIds) });
+   }
+   if (tagIds) {
+     article.tags = await this.tagRepository.findBy({ id: In(tagIds) });
+   }
+   await this.repository.save(article);
+   return UpdateResult.from({ raw: [], affected: 1, records: [] });
+ }
}

1.8. article.controller.ts
src/admin/controllers/article.controller.ts

+import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query, NotFoundException } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from 'src/shared/dto/article.dto';
import { ArticleService } from 'src/shared/services/article.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
+import { CategoryService } from 'src/shared/services/category.service';
+import { TagService } from 'src/shared/services/tag.service';

@UseFilters(AdminExceptionFilter)
@Controller('admin/articles')
export class ArticleController {
    constructor(
+       private readonly articleService: ArticleService,
+       private readonly categoryService: CategoryService,
+       private readonly tagService: TagService,
    ) { }

    @Get()
    @Render('article/article-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { articles, total } = await this.articleService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
        return { articles, keyword, page, limit, pageCount };
    }

    @Get('create')
    @Render('article/article-form')
+   async createForm() {
+       const categoryTree = await this.categoryService.findAll();
+       const tags = await this.tagService.findAll();
+       return { article: { categories: [], tags: [] }, categoryTree, tags };
    }

    @Post()
    @Redirect('/admin/articles')
    async create(@Body() createArticleDto: CreateArticleDto) {
        await this.articleService.create(createArticleDto);
        return { success: true }
    }

    @Get(':id/edit')
    @Render('article/article-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
+       const article = await this.articleService.findOne({ where: { id }, relations:['categories', 'tags']  });
+       if (!article) throw new NotFoundException('Article not Found');
+       const categoryTree = await this.categoryService.findAll();
+       const tags = await this.tagService.findAll();
+       return { article, categoryTree, tags };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateArticleDto: UpdateArticleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        await this.articleService.update(id, updateArticleDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/articles`);
        }
    }

    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.delete(id);
        return { success: true }
    }

    @Get(':id')
    @Render('article/article-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
+       const article = await this.articleService.findOne({ where: { id }, relations:['categories', 'tags'] });
+       if (!article) throw new NotFoundException('Article not Found');
        return { article };
    }
}
1.9. article-form.hbs
views/article/article-form.hbs

<h1>{{#if article.id}}编辑文章{{else}}添加文章{{/if}}</h1>
+<form action="/admin/articles{{#if article.id}}/{{article.id}}{{/if}}" method="POST">
    {{#if article.id}}<input type="hidden" name="_method" value="PUT">{{/if}}
+   <div class="mb-3">
+       <label for="title" class="form-label">标题</label>
+       <input type="text" class="form-control" id="title" name="title" value="{{article.title}}">
+   </div>
+   <div class="mb-3">
+       <label for="content" class="form-label">内容</label>
+       <textarea class="form-control" id="content" name="content" rows="10">{{article.content}}</textarea>
+   </div>
+   <div class="mb-3">
+       <label class="form-label">分类</label>
+       <div id="categoryTree" class="border rounded p-3"></div>
+   </div>
+   <div class="mb-3">
+       <label for="tags" class="form-label">标签</label>
+       <div class="d-flex flex-wrap">
+           {{#each tags}}
+           <div class="form-check me-3 mb-2">
+               <input class="form-check-input" type="checkbox" name="tagIds" value="{{this.id}}" {{#if (contains
+                   (mapToIds ../article.tags) this.id )}}checked{{/if}}>
+               <label class="form-check-label">{{this.name}}</label>
+           </div>
+           {{/each}}
        </div>
    </div>
+   <div class="mb-3">
+       <label for="status" class="form-label">状态</label>
+       <select class="form-control" id="status" name="status">
+           <option value="1" {{#if article.status}}selected{{/if}}>激活</option>
+           <option value="0" {{#unless article.status}}selected{{/unless}}>未激活</option>
+       </select>
+   </div>
+   <button type="submit" class="btn btn-primary">保存</button>
+</form>
+<script>
+   const categoryTree = {{{ json categoryTree }}};
+   const selectedCategoryIds = {{{ mapToIds article.categories }}};
+   function renderCategoryTree(categoryes) {
+       let html = '<ul class="list-unstyled">';
+       categoryes.forEach(function (category) {
+           html += `
+           <li class="mb-2">
+               <div class="d-flex align-items-center">
+                   ${category.children?.length > 0 ? '<span class="toggle me-2 cursor-pointer"><i class="bi bi-folder-minus"></i></span>' : '<span class="me-4"></span>'}
+                   <label class="form-check-label">
+                       <input type="checkbox" class="form-check-input" name="categoryIds" value="${category.id}" ${selectedCategoryIds.includes(category.id) ? 'checked' : ''}>
+                       ${category.name}
+                   </label>
+               </div>
+               ${category.children?.length > 0 ? `<div class="children ms-4" >${renderCategoryTree(category.children)}</div>` : ''}
+           </li>`;
+       });
+       html += '</ul>';
+       return html;
+   }
+   $(function () {
+       $('#categoryTree').html(renderCategoryTree(categoryTree));
+       $('body').on('click', '.toggle', function () {
+           const childrenContainer = $(this).parent().siblings('.children');
+           if (childrenContainer.is(':visible')) {
+               childrenContainer.hide();
+               $(this).html('<i class="bi bi-folder-plus"></i>');
+           } else {
+               childrenContainer.show();
+               $(this).html('<i class="bi bi-folder-minus"></i>');
+           }
+       });
+   });
+</script>
1.10. article-list.hbs
views/article/article-list.hbs

<h1>
  文章列表
</h1>
<a href="/admin/articles/create" class="btn btn-success mb-3">添加文章</a>
<form method="GET" action="/admin/articles" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
<table class="table">
  <thead>
    <tr>
+     <th>标题</th>
+     <th>分类</th>
+     <th>标签</th>
      <td>状态</td>
      <td>排序</td>
      <td>操作</td>
    </tr>
  </thead>
  <tbody>
    {{#each articles}}
+   <tr>
+     <td>{{this.title}}</td>
+     <td>
+       {{#each this.categories}}
+       <span class="badge bg-secondary">{{this.name}}</span>
+       {{/each}}
+     </td>
+     <td>
+       {{#each this.tags}}
+       <span class="badge bg-info text-dark">{{this.name}}</span>
+       {{/each}}
+     </td>
+     <td>
+       <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
+         {{#if this.status}}
+         <i class="bi bi-check-circle-fill text-success"></i>
+         {{else}}
+         <i class="bi bi-x-circle-fill text-danger"></i>
+         {{/if}}
+       </span>
+     </td>
+     <td>
+       <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
+       <input type="number" class="form-control sort-input d-none" style="width:50%" data-id="{{this.id}}"
+         value="{{this.sort}}">
+     </td>
+     <td>
+       <a href="/admin/articles/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
+       <a href="/admin/articles/{{this.id}}/edit" class="btn btn-warning btn-sm">修改</a>
+       <a class="btn btn-danger btn-sm" onclick="deleteArticle({{this.id}})">删除</a>
+     </td>
+   </tr>
+   {{/each}}
  </tbody>
</table>
<nav>
  <ul class="pagination">
    <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
      <a class="page-link" href="?page={{dec page}}&keyword={{keyword}}&limit={{limit}}">上一页</a>
    </li>
    {{#each (range 1 pageCount)}}
    <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
      <a class="page-link" href="?page={{this}}&keyword={{../keyword}}&limit={{../limit}}">{{this}}</a>
    </li>
    {{/each}}

    <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
      <a class="page-link" href="?page={{inc page}}&keyword={{keyword}}&limit={{limit}}">下一页</a>
    </li>
    <li class="page-item">
      <form method="GET" action="/admin/articles" class="d-inline-block ms-3">
        <input type="hidden" name="keyword" value="{{keyword}}">
        <input type="hidden" name="page" value="{{page}}">
        <div class="input-group">
          <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
          <button class="btn btn-outline-secondary" type="submit">设置每页的条数</button>
        </div>
      </form>
    </li>
  </ul>
</nav>
<script>
+ function deleteArticle(id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
            const query = params.toString();
            window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>
2.富文本编辑器
2.1. main.hbs
views/layouts/main.hbs

<!doctype html>
<html lang="en">
+
+<head>
+ <meta charset="utf-8">
+ <meta name="viewport" content="width=device-width, initial-scale=1">
+ <title>CMS</title>
+ <link href="/style/bootstrap.min.css" rel="stylesheet">
+ <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
+ <link rel="stylesheet" href="/style/ckeditor5.css" />
+ <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
+</head>
+
+<body>
+ {{> header }}
+ <div class="container-fluid">
+   <div class="row">
+     {{> sidebar}}
+     <div class="col-md-9 col-lg-10">
+       <div class="container mt-4">
+         {{{body}}}
        </div>
+     </div>
    </div>
+ </div>
+ <script src="/js/bootstrap.bundle.min.js"></script>
+</body>
+
</html>
2.2. article.controller.ts
src/admin/controllers/article.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query, NotFoundException } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from 'src/shared/dto/article.dto';
import { ArticleService } from 'src/shared/services/article.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
import { CategoryService } from 'src/shared/services/category.service';
import { TagService } from 'src/shared/services/tag.service';

@UseFilters(AdminExceptionFilter)
@Controller('admin/articles')
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService,
    ) { }

    @Get()
    @Render('article/article-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { articles, total } = await this.articleService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
        return { articles, keyword, page, limit, pageCount };
    }

    @Get('create')
    @Render('article/article-form')
    async createForm() {
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article: { categories: [], tags: [] }, categoryTree, tags };
    }

    @Post()
    @Redirect('/admin/articles')
    async create(@Body() createArticleDto: CreateArticleDto) {
        await this.articleService.create(createArticleDto);
        return { success: true }
    }

    @Get(':id/edit')
    @Render('article/article-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
+       const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article, categoryTree, tags };
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateArticleDto: UpdateArticleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        await this.articleService.update(id, updateArticleDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/articles`);
        }
    }

    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.delete(id);
        return { success: true }
    }

    @Get(':id')
    @Render('article/article-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
+       const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        return { article };
    }
}

2.3. article-form.hbs
views/article/article-form.hbs

<h1>{{#if article.id}}编辑文章{{else}}添加文章{{/if}}</h1>
+<form action="/admin/articles{{#if article.id}}/{{article.id}}{{/if}}" method="POST" id="articleForm">
    {{#if article.id}}<input type="hidden" name="_method" value="PUT">{{/if}}
    <div class="mb-3">
        <label for="title" class="form-label">标题</label>
        <input type="text" class="form-control" id="title" name="title" value="{{article.title}}">
    </div>
    <div class="mb-3">
        <label for="content" class="form-label">内容</label>
+       <div id="editor">
+           {{{article.content}}}
+       </div>
+       <input type="hidden" name="content" id="contentInput">
    </div>
    <div class="mb-3">
        <label class="form-label">分类</label>
        <div id="categoryTree" class="border rounded p-3"></div>
    </div>
    <div class="mb-3">
        <label for="tags" class="form-label">标签</label>
        <div class="d-flex flex-wrap">
            {{#each tags}}
            <div class="form-check me-3 mb-2">
                <input class="form-check-input" type="checkbox" name="tagIds" value="{{this.id}}" {{#if (contains
                    (mapToIds ../article.tags) this.id )}}checked{{/if}}>
                <label class="form-check-label">{{this.name}}</label>
            </div>
            {{/each}}
        </div>
    </div>
    <div class="mb-3">
        <label for="status" class="form-label">状态</label>
        <select class="form-control" id="status" name="status">
            <option value="1" {{#if article.status}}selected{{/if}}>激活</option>
            <option value="0" {{#unless article.status}}selected{{/unless}}>未激活</option>
        </select>
    </div>
    <button type="submit" class="btn btn-primary">保存</button>
</form>
+<script type="importmap">
+   {
+       "imports": {
+           "ckeditor5": "/js/ckeditor5.js"
+       }
+   }
+</script>
+<script type="module">
+   import {
+       ClassicEditor,
+       Essentials,
+       Bold,
+       Italic,
+       Font,
+       Paragraph,
+       Image,
+       ImageToolbar,
+       ImageUpload,
+       ImageResize,
+       ImageStyle,
+       Plugin
+   } from 'ckeditor5';
+   ClassicEditor
+       .create(document.querySelector('#editor'), {
+           plugins: [
+               Essentials,
+               Bold,
+               Italic,
+               Font,
+               Paragraph,
+               Image,
+               ImageToolbar,
+               ImageStyle,
+               ImageResize,
+               ImageUpload
+           ],
+           image: {
+               toolbar: ['imageTextAlternative', 'imageStyle:side', 'resizeImage:50', 'resizeImage:75', 'resizeImage:original']
+           },
+           toolbar: {
+               items: [
+                   'undo', 'redo', '|', 'bold', 'italic', '|',
+                   'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
+                   'insertImage'
+               ]
+           }
+       })
+       .then(editor => {
+           const form = document.getElementById('articleForm');
+           const contentInput = document.getElementById('contentInput');
+           form.addEventListener('submit', () => {
+               contentInput.value = editor.getData();
+           });
+       })
+       .catch(error => {
+           console.error(error.stack);
+       });
+</script>
<script>
    const categoryTree = {{{ json categoryTree }}};
    const selectedCategoryIds = {{{ mapToIds article.categories }}};
    function renderCategoryTree(categoryes) {
        let html = '<ul class="list-unstyled">';
        categoryes.forEach(function (category) {
            html += `
            <li class="mb-2">
                <div class="d-flex align-items-center">
                    ${category.children?.length > 0 ? '<span class="toggle me-2 cursor-pointer"><i class="bi bi-folder-minus"></i></span>' : '<span class="me-4"></span>'}
                    <label class="form-check-label">
                        <input type="checkbox" class="form-check-input" name="categoryIds" value="${category.id}" ${selectedCategoryIds.includes(category.id) ? 'checked' : ''}>
                        ${category.name}
                    </label>
                </div>
                ${category.children?.length > 0 ? `<div class="children ms-4" >${renderCategoryTree(category.children)}</div>` : ''}
            </li>`;
        });
        html += '</ul>';
        return html;
    }
    $(function () {
        $('#categoryTree').html(renderCategoryTree(categoryTree));
        $('body').on('click', '.toggle', function () {
            const childrenContainer = $(this).parent().siblings('.children');
            if (childrenContainer.is(':visible')) {
                childrenContainer.hide();
                $(this).html('<i class="bi bi-folder-plus"></i>');
            } else {
                childrenContainer.show();
                $(this).html('<i class="bi bi-folder-minus"></i>');
            }
        });
    });
</script>
3.文件上传
npm i @nestjs/serve-static
npm i @types/multer --save-dev
`
3.1. global.d.ts
src/global.d.ts

declare namespace Express {
    interface Multer {
        File: Express.Multer.File;
    }
}

3.2. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { UserController } from './controllers/user.controller';
import { RoleController } from "./controllers/role.controller";
import { AccessController } from "./controllers/access.controller";
import { TagController } from "./controllers/tag.controller";
import { ArticleController } from "./controllers/article.controller";
import { CategoryController } from "./controllers/category.controller";
+import { UploadController } from './controllers/upload.controller';
@Module({
+   controllers: [DashboardController, UserController, RoleController, AccessController, TagController, ArticleController, CategoryController, UploadController]
})
export class AdminModule {
}

3.3. article-detail.hbs
views/article/article-detail.hbs

<h1>
    文章详情
</h1>
<div class="mb-3">
    <label class="form-label">标题:</label>
    <p class="form-control-plaintext">{{article.title}}</p>
</div>
+<div class="mb-3">
+   <label class="form-label">内容:</label>
+   <div class="form-control-plaintext">
+       {{{article.content}}}
+   </div>
+</div>
<div class="mb-3">
    <label class="form-label">分类:</label>
    <p class="form-control-plaintext">
        {{#each article.categories}}
        <span class="badge bg-secondary">{{this.name}}</span>
        {{/each}}
    </p>
</div>
<div class="mb-3">
    <label class="form-label">标签:</label>
    <p class="form-control-plaintext">
        {{#each article.tags}}
        <span class="badge bg-info text-dark">{{this.name}}</span>
        {{/each}}
    </p>
</div>
<a href="/admin/articles/{{article.id}}/edit" class="btn btn-warning btn-sm">修改</a>
<a href="/admin/articles" class="btn btn-secondary btn-sm">返回列表</a>
3.4. upload.controller.ts
src/admin/controllers/upload.controller.ts

import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
@Controller('admin')
export class UploadController {
    @Post('upload')
    @UseInterceptors(FileInterceptor('upload', {
        storage: diskStorage({
            destination: './uploads',
            filename: (_req, file, callback) => {
                const filename: string = uuidv4() + path.extname(file.originalname);
                callback(null, filename);
            }
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                return callback(new Error('Unsupported file type'), false);
            }
            callback(null, true);
        }
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return { url: `/uploads/${file.filename}` };
    }
}

3.5. app.module.ts
src/app.module.ts

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { ApiModule } from './api/api.module';
import { SharedModule } from './shared/shared.module';
+import { AcceptLanguageResolver, QueryResolver, I18nModule, } from 'nestjs-i18n';
import * as  path from 'path';
import methodOverride from 'src/shared/middlewares/method-override'
+import { ServeStaticModule } from '@nestjs/serve-static';
@Module({
  imports: [
+   ServeStaticModule.forRoot({
+     rootPath: path.join(__dirname, '..', 'uploads'),
+     serveRoot: '/uploads',
+   }),
    I18nModule.forRoot({
+     fallbackLanguage: 'en',
+     loaderOptions: {
+       path: path.join(__dirname, '/i18n/'),
+       watch: true
      },
      resolvers: [
+       new QueryResolver(["lang", "l"]),
        AcceptLanguageResolver,
      ]
    }),
    SharedModule,
+   AdminModule,
    ApiModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(methodOverride).forRoutes('*');
  }
+
}

3.6. article-form.hbs
views/article/article-form.hbs

<h1>{{#if article.id}}编辑文章{{else}}添加文章{{/if}}</h1>
<form action="/admin/articles{{#if article.id}}/{{article.id}}{{/if}}" method="POST" id="articleForm">
    {{#if article.id}}<input type="hidden" name="_method" value="PUT">{{/if}}
    <div class="mb-3">
        <label for="title" class="form-label">标题</label>
        <input type="text" class="form-control" id="title" name="title" value="{{article.title}}">
    </div>
    <div class="mb-3">
        <label for="content" class="form-label">内容</label>
        <div id="editor">
            {{{article.content}}}
        </div>
        <input type="hidden" name="content" id="contentInput">
    </div>
    <div class="mb-3">
        <label class="form-label">分类</label>
        <div id="categoryTree" class="border rounded p-3"></div>
    </div>
    <div class="mb-3">
        <label for="tags" class="form-label">标签</label>
        <div class="d-flex flex-wrap">
            {{#each tags}}
            <div class="form-check me-3 mb-2">
                <input class="form-check-input" type="checkbox" name="tagIds" value="{{this.id}}" {{#if (contains
                    (mapToIds ../article.tags) this.id )}}checked{{/if}}>
                <label class="form-check-label">{{this.name}}</label>
            </div>
            {{/each}}
        </div>
    </div>
    <div class="mb-3">
        <label for="status" class="form-label">状态</label>
        <select class="form-control" id="status" name="status">
            <option value="1" {{#if article.status}}selected{{/if}}>激活</option>
            <option value="0" {{#unless article.status}}selected{{/unless}}>未激活</option>
        </select>
    </div>
    <button type="submit" class="btn btn-primary">保存</button>
</form>
<script type="importmap">
    {
        "imports": {
            "ckeditor5": "/js/ckeditor5.js"
        }
    }
</script>
<script type="module">
    import {
        ClassicEditor,
        Essentials,
        Bold,
        Italic,
        Font,
        Paragraph,
        Image,
        ImageToolbar,
        ImageUpload,
        ImageResize,
        ImageStyle,
+       Plugin,
+       SimpleUploadAdapter
    } from 'ckeditor5';
    ClassicEditor
        .create(document.querySelector('#editor'), {
            plugins: [
                Essentials,
                Bold,
                Italic,
                Font,
                Paragraph,
                Image,
                ImageToolbar,
                ImageStyle,
                ImageResize,
+               ImageUpload,
+               SimpleUploadAdapter
            ],
            image: {
                toolbar: ['imageTextAlternative', 'imageStyle:side', 'resizeImage:50', 'resizeImage:75', 'resizeImage:original']
            },
            toolbar: {
                items: [
                    'undo', 'redo', '|', 'bold', 'italic', '|',
                    'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
                    'insertImage'
                ]
+           },
+           simpleUpload: {
+               uploadUrl: '/admin/upload',
+               withCredentials: true,
+               headers: {
+                   Authorization: 'Bearer <JSON Web Token>'
+               }
            }
        })
        .then(editor => {
            const form = document.getElementById('articleForm');
            const contentInput = document.getElementById('contentInput');
            form.addEventListener('submit', () => {
                contentInput.value = editor.getData();
            });
        })
        .catch(error => {
            console.error(error.stack);
        });
</script>
<script>
    const categoryTree = {{{ json categoryTree }}};
    const selectedCategoryIds = {{{ mapToIds article.categories }}};
    function renderCategoryTree(categoryes) {
        let html = '<ul class="list-unstyled">';
        categoryes.forEach(function (category) {
            html += `
            <li class="mb-2">
                <div class="d-flex align-items-center">
                    ${category.children?.length > 0 ? '<span class="toggle me-2 cursor-pointer"><i class="bi bi-folder-minus"></i></span>' : '<span class="me-4"></span>'}
                    <label class="form-check-label">
                        <input type="checkbox" class="form-check-input" name="categoryIds" value="${category.id}" ${selectedCategoryIds.includes(category.id) ? 'checked' : ''}>
                        ${category.name}
                    </label>
                </div>
                ${category.children?.length > 0 ? `<div class="children ms-4" >${renderCategoryTree(category.children)}</div>` : ''}
            </li>`;
        });
        html += '</ul>';
        return html;
    }
    $(function () {
        $('#categoryTree').html(renderCategoryTree(categoryTree));
        $('body').on('click', '.toggle', function () {
            const childrenContainer = $(this).parent().siblings('.children');
            if (childrenContainer.is(':visible')) {
                childrenContainer.hide();
                $(this).html('<i class="bi bi-folder-plus"></i>');
            } else {
                childrenContainer.show();
                $(this).html('<i class="bi bi-folder-minus"></i>');
            }
        });
    });
</script>
4.图片压缩
4.1. upload.controller.ts
src/admin/controllers/upload.controller.ts

// 导入必要的装饰器和模块
import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs';
// 定义一个控制器，控制器的路径前缀为 'admin'
@Controller('admin')
export class UploadController {
    // 定义一个 POST 路由，路径为 'upload'
    @Post('upload')
    // 使用 FileInterceptor 拦截器来处理文件上传
    @UseInterceptors(FileInterceptor('upload', {
        // 设置文件存储的配置
        storage: diskStorage({
            // 指定上传文件的存储目录为 './uploads'
            destination: './uploads',
            // 自定义文件命名方式，使用 UUID 生成唯一文件名，并保留原始文件扩展名
            filename: (_req, file, callback) => {
                const filename: string = uuidv4() + path.extname(file.originalname);
                callback(null, filename);
            }
        }),
        // 文件过滤器，限制只接受特定的图片类型（jpg, jpeg, png, gif）
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                return callback(new Error('Unsupported file type'), false);
            }
            callback(null, true);
        }
    }))
    // 定义上传文件处理逻辑
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
+       // 生成压缩后的文件名，扩展名为 .min.jpeg
+       const filename = `${path.basename(file.filename, path.extname(file.filename))}.min.jpeg`;
+       // 设置压缩后的文件路径
+       const outputFilePath = `./uploads/${filename}`;
+       // 使用 sharp 库处理图像，进行缩放、转换格式和压缩质量设置
+       await sharp(file.path)
+           .resize(800, 600, {
+               fit: sharp.fit.inside, // 使用 inside 适应方式缩放图像
+               withoutEnlargement: true // 防止图像被放大
+           })
+           .toFormat('jpeg') // 转换图像格式为 jpeg
+           .jpeg({ quality: 80 }) // 设置图像压缩质量为 80%
+           .toFile(outputFilePath); // 输出处理后的图像到指定路径
+       // 删除原始上传的文件
+       fs.unlinkSync(file.path);
+       // 返回包含压缩后图像的 URL 的对象
+       return { url: `/uploads/${filename}` };
    }
}

5.上传至COS
COS
npm install cos-nodejs-sdk-v5
5.1. cos.service.ts
src/shared/services/cos.service.ts

// 导入 Injectable 装饰器，用于标记一个服务类
import { Injectable } from '@nestjs/common';
// 导入 ConfigService，用于获取配置文件中的配置信息
import { ConfigService } from '@nestjs/config';
// 导入 COS SDK
import * as COS from 'cos-nodejs-sdk-v5';
// 使用 Injectable 装饰器将 CosService 标记为可注入的服务
@Injectable()
export class CosService {
    // 定义一个私有变量，用于存储 COS 实例
    private cos: COS;
    // 构造函数，注入 ConfigService 以获取配置信息
    constructor(private readonly configService: ConfigService) {
        // 初始化 COS 实例，使用配置服务中的 SecretId 和 SecretKey
        this.cos = new COS({
            SecretId: this.configService.get('COS_SECRET_ID'),
            SecretKey: this.configService.get('COS_SECRET_KEY'),
        });
    }
    // 获取签名认证信息的方法，默认过期时间为 60 秒
    getAuth(key, expirationTime = 60) {
        // 从配置服务中获取 COS 存储桶名称和区域
        const bucket = this.configService.get('COS_BUCKET');
        const region = this.configService.get('COS_REGION');
        // 获取 COS 签名，用于 PUT 请求
        const sign = this.cos.getAuth({
            Method: 'put', // 请求方法为 PUT
            Key: key, // 文件的对象键（路径）
            Expires: expirationTime, // 签名的有效期
            Bucket: bucket, // 存储桶名称
            Region: region, // 存储桶所在区域
        });
        // 返回包含签名、键名、存储桶和区域的信息对象
        return {
            sign,
            key: key,
            bucket,
            region,
        };
    }
}

5.2. upload.controller.ts
src/admin/controllers/upload.controller.ts

import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs';
+import { CosService } from 'src/shared/services/cos.service';
@Controller('admin')
export class UploadController {
+   constructor(
+       private readonly cosService: CosService,
+   ) { }
    @Post('upload')
    @UseInterceptors(FileInterceptor('upload', {
        storage: diskStorage({
            destination: './uploads',
            filename: (_req, file, callback) => {
                const filename: string = uuidv4() + path.extname(file.originalname);
                callback(null, filename);
            }
        }),
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                return callback(new Error('Unsupported file type'), false);
            }
            callback(null, true);
        }
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const filename = `${path.basename(file.filename, path.extname(file.filename))}.min.jpeg`;
        const outputFilePath = `./uploads/${filename}`;
        await sharp(file.path)
            .resize(800, 600, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(outputFilePath);
        fs.unlinkSync(file.path);
        return { url: `/uploads/${filename}` };
    }
+
+   @Get('cos-signature')
+   async getCosSignature(@Query('key') key: string) {
+       return this.cosService.getAuth(key, 60);
+   }
}

5.3. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
+import { CosService } from './services/cos.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

5.4. article-form.hbs
views/article/article-form.hbs

<h1>{{#if article.id}}编辑文章{{else}}添加文章{{/if}}</h1>
<form action="/admin/articles{{#if article.id}}/{{article.id}}{{/if}}" method="POST" id="articleForm">
    {{#if article.id}}<input type="hidden" name="_method" value="PUT">{{/if}}
    <div class="mb-3">
        <label for="title" class="form-label">标题</label>
        <input type="text" class="form-control" id="title" name="title" value="{{article.title}}">
    </div>
    <div class="mb-3">
        <label for="content" class="form-label">内容</label>
        <div id="editor">
            {{{article.content}}}
        </div>
        <input type="hidden" name="content" id="contentInput">
    </div>
    <div class="mb-3">
        <label class="form-label">分类</label>
        <div id="categoryTree" class="border rounded p-3"></div>
    </div>
    <div class="mb-3">
        <label for="tags" class="form-label">标签</label>
        <div class="d-flex flex-wrap">
            {{#each tags}}
            <div class="form-check me-3 mb-2">
                <input class="form-check-input" type="checkbox" name="tagIds" value="{{this.id}}" {{#if (contains
                    (mapToIds ../article.tags) this.id )}}checked{{/if}}>
                <label class="form-check-label">{{this.name}}</label>
            </div>
            {{/each}}
        </div>
    </div>
    <div class="mb-3">
        <label for="status" class="form-label">状态</label>
        <select class="form-control" id="status" name="status">
            <option value="1" {{#if article.status}}selected{{/if}}>激活</option>
            <option value="0" {{#unless article.status}}selected{{/unless}}>未激活</option>
        </select>
    </div>
    <button type="submit" class="btn btn-primary">保存</button>
</form>
<script type="importmap">
    {
        "imports": {
            "ckeditor5": "/js/ckeditor5.js"
        }
    }
</script>
<script type="module">
    import {
        ClassicEditor,
        Essentials,
        Bold,
        Italic,
        Font,
        Paragraph,
        Image,
        ImageToolbar,
        ImageUpload,
        ImageResize,
        ImageStyle,
        Plugin,
        SimpleUploadAdapter
    } from 'ckeditor5';
+   // 异步函数，用于获取文件上传的签名信息
+   async function getSignature(key) {
+       // 发送请求到后台接口，获取 COS 上传的签名信息
+       const response = await fetch(`/admin/cos-signature?key=${encodeURIComponent(key)}`);
+       // 返回签名信息的 JSON 数据
+       return response.json();
+   }
+   // 自定义的 COS 上传适配器类，用于将文件上传到腾讯云 COS
+   class COSUploadAdapter {
+       // 构造函数，接收一个文件加载器实例
+       constructor(loader) {
+           this.loader = loader;
+       }

+       // 上传方法，负责将文件上传到 COS
+       async upload() {
+           // 等待加载器获取要上传的文件
+           const file = await this.loader.file;
+           // 获取文件的上传签名信息
+           const signature = await getSignature(file.name);
+           // 从签名信息中解构出存储桶、区域、文件键名和签名
+           const { bucket, region, key, sign } = signature;
+           // 构造文件上传的 URL
+           const url = `https://${signature.bucket}.cos.${signature.region}.myqcloud.com/${signature.key}`;
+           // 发送 PUT 请求，将文件上传到 COS
+           return fetch(url, {
+               method: 'PUT', // 使用 PUT 方法上传文件
+               headers: { Authorization: sign }, // 设置请求头，包含签名信息
+               body: file // 请求体为文件本身
+           }).then(response => {
+               // 上传成功后，返回包含文件 URL 的对象
+               return { default: url };
+           });
+       }
+   }
+   // 插件类，用于将 COS 上传适配器集成到 CKEditor
+   class COSUploadAdapterPlugin extends Plugin {
+       // 静态方法，定义插件的依赖关系
+       static get requires() {
+           return [ImageUpload]; // 依赖 ImageUpload 插件
+       }
+       // 插件初始化方法
+       init() {
+           // 获取文件库插件，并设置创建上传适配器的函数
+           this.editor.plugins.get('FileRepository').createUploadAdapter = (loader) => new COSUploadAdapter(loader);
+       }
+   }
    ClassicEditor
        .create(document.querySelector('#editor'), {
            plugins: [
                Essentials,
                Bold,
                Italic,
                Font,
                Paragraph,
                Image,
                ImageToolbar,
                ImageStyle,
                ImageResize,
                ImageUpload,
+               COSUploadAdapterPlugin
            ],
            image: {
                toolbar: ['imageTextAlternative', 'imageStyle:side', 'resizeImage:50', 'resizeImage:75', 'resizeImage:original']
            },
            toolbar: {
                items: [
                    'undo', 'redo', '|', 'bold', 'italic', '|',
                    'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
                    'insertImage'
                ]
            },
            simpleUpload: {
                uploadUrl: '/admin/upload',
                withCredentials: true,
                headers: {
                    Authorization: 'Bearer <JSON Web Token>'
                }
            }
        })
        .then(editor => {
            const form = document.getElementById('articleForm');
            const contentInput = document.getElementById('contentInput');
            form.addEventListener('submit', () => {
                contentInput.value = editor.getData();
            });
        })
        .catch(error => {
            console.error(error.stack);
        });
</script>
<script>
    const categoryTree = {{{ json categoryTree }}};
    const selectedCategoryIds = {{{ mapToIds article.categories }}};
    function renderCategoryTree(categoryes) {
        let html = '<ul class="list-unstyled">';
        categoryes.forEach(function (category) {
            html += `
            <li class="mb-2">
                <div class="d-flex align-items-center">
                    ${category.children?.length > 0 ? '<span class="toggle me-2 cursor-pointer"><i class="bi bi-folder-minus"></i></span>' : '<span class="me-4"></span>'}
                    <label class="form-check-label">
                        <input type="checkbox" class="form-check-input" name="categoryIds" value="${category.id}" ${selectedCategoryIds.includes(category.id) ? 'checked' : ''}>
                        ${category.name}
                    </label>
                </div>
                ${category.children?.length > 0 ? `<div class="children ms-4" >${renderCategoryTree(category.children)}</div>` : ''}
            </li>`;
        });
        html += '</ul>';
        return html;
    }
    $(function () {
        $('#categoryTree').html(renderCategoryTree(categoryTree));
        $('body').on('click', '.toggle', function () {
            const childrenContainer = $(this).parent().siblings('.children');
            if (childrenContainer.is(':visible')) {
                childrenContainer.hide();
                $(this).html('<i class="bi bi-folder-plus"></i>');
            } else {
                childrenContainer.show();
                $(this).html('<i class="bi bi-folder-minus"></i>');
            }
        });
    });
</script>
6.增加审核状态
6.1. article.enum.ts
src/shared/enums/article.enum.ts

export enum ArticleStateEnum {
    DRAFT = 'draft',
    PENDING = 'pending',
    PUBLISHED = 'published',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn'
}
6.2. article.entity.ts
src/shared/entities/article.entity.ts

import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { ArticleStateEnum } from '../enums/article.enum';
+@Entity()
+export class Article {
+   @PrimaryGeneratedColumn()
+   @ApiProperty({ description: 'ID', example: 1 })
+   id: number;
+   @Column({ length: 50, unique: true })
+   @ApiProperty({ description: '标题', example: '文章标题' })
+   title: string;
+   @Column('text')
+   @ApiProperty({ description: '内容', example: '文章内容' })
+   content: string;
+   @ManyToMany(() => Category)
+   @JoinTable()
+   categories: Category[];
+   @ManyToMany(() => Tag)
+   @JoinTable()
+   tags: Tag[];
+
+   @Column({ type: 'enum', enum: ArticleStateEnum, default: 'draft' })
+   @ApiProperty({ description: '文章状态', example: 'draft' })
+   state: ArticleStateEnum;
+
+   @Column({ type: 'text', nullable: true })
+   @ApiProperty({ description: '审核不通过原因', example: '内容不符合要求' })
+   rejectionReason: string;
+
+   @Column({ default: 1 })
+   @ApiProperty({ description: '生效状态', example: 1 })
+   status: number;
+   @Column({ default: 100 })
+   @ApiProperty({ description: '排序号', example: 100 })
+   sort: number;
+   @CreateDateColumn()
+   @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
+   createdAt: Date;
+   @UpdateDateColumn()
+   @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
+   updatedAt: Date;
+}
+
6.3. article.dto.ts
src/shared/dto/article.dto.ts

import { ApiProperty, PartialType as PartialTypeFromSwagger } from '@nestjs/swagger';
import { IsString, IsInt, MaxLength, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { IdValidators, StatusValidators, SortValidators } from '../decorators/dto.decorator';
import { Transform } from 'class-transformer';
+import { ArticleStateEnum } from '../enums/article.enum';
+export class CreateArticleDto {
+   @ApiProperty({ description: '标题', example: '文章标题' })
+   @IsString()
+   @MaxLength(50, { message: '标题不能超过50个字符' })
+   title: string;
+   @ApiProperty({ description: '内容', example: '文章内容' })
+   content: string;
+   @ApiProperty({ description: '分类ID数组', example: [1, 2] })
+   @Transform(({ value }) => Array.isArray(value) ? value.map(Number) : [Number(value)])
+   @IsInt({ each: true })
+   categoryIds: number[];
+   @ApiProperty({ description: '标签ID数组', example: [1, 2] })
+   @Transform(({ value }) => Array.isArray(value) ? value.map(Number) : [Number(value)])
+   @IsInt({ each: true })
+   tagIds: number[];
+   @StatusValidators()
+   @ApiProperty({ description: '状态', example: 1 })
+   status: number;
+   @SortValidators()
+   @ApiProperty({ description: '排序号', example: 100 })
+   sort: number;
+
+   @ApiProperty({ description: '文章状态', example: 'draft' })
+   @Transform(({ value }) => ArticleStateEnum[value])
+   state: ArticleStateEnum;
+
+   @ApiProperty({ description: '审核不通过原因', required: false, example: '内容不符合要求' })
+   @IsString()
+   @IsOptional()
+   rejectionReason?: string;
+}
+export class UpdateArticleDto extends PartialTypeFromSwagger(PartialType(CreateArticleDto)) {
+   @IdValidators()
+   id?: number;
+}
+
6.4. article-detail.hbs
views/article/article-detail.hbs

<h1>
    文章详情
</h1>
<div class="mb-3">
    <label class="form-label">标题:</label>
    <p class="form-control-plaintext">{{article.title}}</p>
</div>
<div class="mb-3">
    <label class="form-label">内容:</label>
    <div class="form-control-plaintext">
        {{{article.content}}}
    </div>
</div>
<div class="mb-3">
    <label class="form-label">分类:</label>
    <p class="form-control-plaintext">
        {{#each article.categories}}
        <span class="badge bg-secondary">{{this.name}}</span>
        {{/each}}
    </p>
</div>
<div class="mb-3">
    <label class="form-label">标签:</label>
    <p class="form-control-plaintext">
        {{#each article.tags}}
        <span class="badge bg-info text-dark">{{this.name}}</span>
        {{/each}}
    </p>
</div>
+<div class="mb-3">
+   <label class="form-label">状态:</label>
+   <p class="form-control-plaintext">
+       {{#if (eq article.state 'draft')}}草稿{{/if}}
+       {{#if (eq article.state 'pending')}}待审核{{/if}}
+       {{#if (eq article.state 'published')}}已发布{{/if}}
+       {{#if (eq article.state 'rejected')}}审核不通过{{/if}}
+   </p>
+</div>
+{{#if (eq article.state 'rejected')}}
+<div class="mb-3">
+   <label class="form-label">不通过原因:</label>
+   <p class="form-control-plaintext">{{article.rejectionReason}}</p>
+</div>
+{{/if}}
+{{#if (eq article.state 'pending')}}
+<div class="mb-3">
+   <button id="approveButton" class="btn btn-success">审核通过</button>
+   <button id="rejectButton" class="btn btn-danger">审核不通过</button>
+</div>
+{{/if}}
<a href="/admin/articles/{{article.id}}/edit" class="btn btn-warning btn-sm">修改</a>
<a href="/admin/articles" class="btn btn-secondary btn-sm">返回列表</a>
+<div id="rejectionReasonModal" class="modal fade" tabindex="-1">
+   <div class="modal-dialog">
+       <div class="modal-content">
+           <div class="modal-header">
+               <h5 class="modal-title">填写审核不通过原因</h5>
+               <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
+           </div>
+           <div class="modal-body">
+               <textarea id="rejectionReason" class="form-control" rows="3" placeholder="请输入不通过原因"></textarea>
+           </div>
+           <div class="modal-footer">
+               <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
+               <button id="confirmRejectionButton" type="button" class="btn btn-danger">确认不通过</button>
+           </div>
+       </div>
+   </div>
+</div>
+<script>
+   $(function () {
+       $('#approveButton').on('click', function () {
+           if (confirm('确定要通过审核吗？')) {
+               $.ajax({
+                   url: `/admin/articles/{{article.id}}/approve`,
+                   type: 'PUT',
+                   success: function (data) {
+                       if (data.success) {
+                           alert('审核通过');
+                           location.reload();
+                       } else {
+                           alert('审核通过失败');
+                       }
+                   },
+                   error: function () {
+                       alert('审核通过失败');
+                   }
+               });
+           }
+       });
+
+       $('#rejectButton').on('click', function () {
+           $('#rejectionReasonModal').modal('show');
+       });
+
+       $('#confirmRejectionButton').on('click', function () {
+           const rejectionReason = $('#rejectionReason').val().trim();
+           if (rejectionReason === '') {
+               alert('请填写审核不通过的原因');
+               return;
+           }
+           $.ajax({
+               url: `/admin/articles/{{article.id}}/reject`,
+               type: 'PUT',
+               contentType: 'application/json',
+               data: JSON.stringify({ rejectionReason: rejectionReason }),
+               success: function (data) {
+                   if (data.success) {
+                       alert('审核不通过');
+                       location.reload();
+                   } else {
+                       alert('审核不通过失败');
+                   }
+               },
+               error: function () {
+                   alert('审核不通过失败');
+               }
+           });
+       });
+   });
+</script>
6.5. article.controller.ts
src/admin/controllers/article.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query, NotFoundException } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from 'src/shared/dto/article.dto';
import { ArticleService } from 'src/shared/services/article.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';
+import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
+import { CategoryService } from 'src/shared/services/category.service';
+import { TagService } from 'src/shared/services/tag.service';
+import { ArticleStateEnum } from 'src/shared/enums/article.enum';
+@UseFilters(AdminExceptionFilter)
+@Controller('admin/articles')
+export class ArticleController {
+   constructor(
+       private readonly articleService: ArticleService,
+       private readonly categoryService: CategoryService,
+       private readonly tagService: TagService,
+   ) { }
+   @Get()
+   @Render('article/article-list')
+   async findAll(@Query('keyword') keyword: string = '',
+       @Query('page', new ParseOptionalIntPipe(1)) page: number,
+       @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
+       const { articles, total } = await this.articleService.findAllWithPagination(page, limit, keyword);
+       const pageCount = Math.ceil(total / limit);
+       return { articles, keyword, page, limit, pageCount };
+   }
+   @Get('create')
+   @Render('article/article-form')
+   async createForm() {
+       const categoryTree = await this.categoryService.findAll();
+       const tags = await this.tagService.findAll();
+       return { article: { categories: [], tags: [] }, categoryTree, tags };
+   }
+   @Post()
+   @Redirect('/admin/articles')
+   async create(@Body() createArticleDto: CreateArticleDto) {
+       await this.articleService.create(createArticleDto);
+       return { success: true }
+   }
+   @Get(':id/edit')
+   @Render('article/article-form')
+   async editForm(@Param('id', ParseIntPipe) id: number) {
+       const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
+       if (!article) throw new NotFoundException('Article not Found');
+       const categoryTree = await this.categoryService.findAll();
+       const tags = await this.tagService.findAll();
+       return { article, categoryTree, tags };
+   }
+   @Put(':id')
+   async update(@Param('id', ParseIntPipe) id: number, @Body() updateArticleDto: UpdateArticleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
+       updateArticleDto.state = ArticleStateEnum.DRAFT;
+       await this.articleService.update(id, updateArticleDto);
+       if (accept === 'application/json') {
+           return { success: true };
+       } else {
+           return res.redirect(`/admin/articles`);
+       }
+   }
+   @Delete(":id")
+   async delete(@Param('id', ParseIntPipe) id: number) {
+       await this.articleService.delete(id);
+       return { success: true }
+   }
+   @Get(':id')
+   @Render('article/article-detail')
+   async findOne(@Param('id', ParseIntPipe) id: number) {
+       const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
+       if (!article) throw new NotFoundException('Article not Found');
+       return { article };
+   }
+
+   @Put(':id/submit')
+   async submitForReview(@Param('id', ParseIntPipe) id: number) {
+       await this.articleService.update(id, { state: ArticleStateEnum.PENDING });
+       return { success: true };
+   }
+
+   @Put(':id/approve')
+   async approveArticle(@Param('id', ParseIntPipe) id: number) {
+       await this.articleService.update(id, { state: ArticleStateEnum.PUBLISHED, rejectionReason: null });
+       return { success: true };
+   }
+
+   @Put(':id/reject')
+   async rejectArticle(
+       @Param('id', ParseIntPipe) id: number,
+       @Body('rejectionReason') rejectionReason: string
+   ) {
+       await this.articleService.update(id, { state: ArticleStateEnum.REJECTED, rejectionReason });
+       return { success: true };
+   }
+
+   @Put(':id/withdraw')
+   async withdrawArticle(@Param('id', ParseIntPipe) id: number) {
+       await this.articleService.update(id, { state: ArticleStateEnum.WITHDRAWN });
+       return { success: true };
+   }
+}
+
6.6. article-list.hbs
views/article/article-list.hbs

<h1>
  文章列表
</h1>
<a href="/admin/articles/create" class="btn btn-success mb-3">添加文章</a>
<form method="GET" action="/admin/articles" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
<table class="table">
  <thead>
    <tr>
      <th>标题</th>
      <th>分类</th>
      <th>标签</th>
+     <th>文章状态</th>
      <td>状态</td>
      <td>排序</td>
      <td>操作</td>
    </tr>
  </thead>
  <tbody>
    {{#each articles}}
    <tr>
      <td>{{this.title}}</td>
      <td>
        {{#each this.categories}}
        <span class="badge bg-secondary">{{this.name}}</span>
        {{/each}}
      </td>
      <td>
        {{#each this.tags}}
        <span class="badge bg-info text-dark">{{this.name}}</span>
        {{/each}}
      </td>
+     <td>
+       {{#if (eq this.state 'draft')}}
+       <span class="badge bg-secondary">草稿</span>
+       {{/if}}
+
+       {{#if (eq this.state 'pending')}}
+       <span class="badge bg-warning text-dark">待审核</span>
+       {{/if}}
+
+       {{#if (eq this.state 'published')}}
+       <span class="badge bg-success">已发布</span>
+       {{/if}}
+
+       {{#if (eq this.state 'rejected')}}
+       <span class="badge bg-danger">审核不通过</span>
+       {{/if}}
+
+       {{#if (eq this.state 'withdrawn')}}
+       <span class="badge bg-dark">已撤回</span>
+       {{/if}}
+     </td>
      <td>
        <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
          {{#if this.status}}
          <i class="bi bi-check-circle-fill text-success"></i>
          {{else}}
          <i class="bi bi-x-circle-fill text-danger"></i>
          {{/if}}
        </span>
      </td>
      <td>
        <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
        <input type="number" class="form-control sort-input d-none" style="width:50%" data-id="{{this.id}}"
          value="{{this.sort}}">
      </td>
      <td>
        <a href="/admin/articles/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
        <a href="/admin/articles/{{this.id}}/edit" class="btn btn-warning btn-sm">修改</a>
        <a class="btn btn-danger btn-sm" onclick="deleteArticle({{this.id}})">删除</a>
+       {{#if (eq this.state 'draft')}}
+       <button class="btn btn-warning btn-sm" onclick="submitForReview({{this.id}})">提交审核</button>
+       {{/if}}
+       {{#if (eq this.state 'pending')}}
+       <button class="btn btn-success btn-sm" onclick="approveArticle({{this.id}})">审核通过</button>
+       <button class="btn btn-danger btn-sm" data-bs-toggle="modal"
+         data-bs-target="#rejectModal-{{this.id}}">审核不通过</button>
+       <div class="modal fade" id="rejectModal-{{this.id}}" tabindex="-1">
+         <div class="modal-dialog">
+           <div class="modal-content">
+             <div class="modal-header">
+               <h5 class="modal-title">审核不通过</h5>
+               <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
+             </div>
+             <div class="modal-body">
+               <div class="mb-3">
+                 <label for="rejectionReason-{{this.id}}" class="form-label">不通过原因</label>
+                 <textarea class="form-control" id="rejectionReason-{{this.id}}" name="rejectionReason"
+                   rows="3"></textarea>
+               </div>
+             </div>
+             <div class="modal-footer">
+               <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
+               <button type="button" class="btn btn-danger" onclick="rejectArticle({{this.id}})">提交</button>
+             </div>
+           </div>
+         </div>
+       </div>
+       {{/if}}
+       {{#if (eq this.state 'published')}}
+       <button class="btn btn-secondary btn-sm" onclick="withdrawArticle({{this.id}})">撤回</button>
+       {{/if}}
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>
<nav>
  <ul class="pagination">
    <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
      <a class="page-link" href="?page={{dec page}}&keyword={{keyword}}&limit={{limit}}">上一页</a>
    </li>
    {{#each (range 1 pageCount)}}
    <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
      <a class="page-link" href="?page={{this}}&keyword={{../keyword}}&limit={{../limit}}">{{this}}</a>
    </li>
    {{/each}}

    <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
      <a class="page-link" href="?page={{inc page}}&keyword={{keyword}}&limit={{limit}}">下一页</a>
    </li>
    <li class="page-item">
      <form method="GET" action="/admin/articles" class="d-inline-block ms-3">
        <input type="hidden" name="keyword" value="{{keyword}}">
        <input type="hidden" name="page" value="{{page}}">
        <div class="input-group">
          <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
          <button class="btn btn-outline-secondary" type="submit">设置每页的条数</button>
        </div>
      </form>
    </li>
  </ul>
</nav>
<script>
+ function submitForReview(id) {
+   if (confirm('确定要提交审核吗？')) {
+     $.ajax({
+       url: `/admin/articles/${id}/submit`,
+       type: 'PUT',
+       success: function (data) {
+         if (data.success) {
+           alert('提交审核成功');
+           location.reload();
+         }
+       },
+       error: function (error) {
+         alert('提交审核失败');
+       }
+     });
+   }
+ }
+
+ function approveArticle(id) {
+   if (confirm('确定要通过审核吗？')) {
+     $.ajax({
+       url: `/admin/articles/${id}/approve`,
+       type: 'PUT',
+       success: function (data) {
+         if (data.success) {
+           alert('审核通过');
+           location.reload();
+         }
+       },
+       error: function (error) {
+         alert('审核通过失败');
+       }
+     });
+   }
+ }
+
+ function rejectArticle(id) {
+   const rejectionReason = $(`#rejectionReason-${id}`).val();
+   if (rejectionReason.trim() === '') {
+     alert('请填写审核不通过的原因');
+     return;
+   }
+   $.ajax({
+     url: `/admin/articles/${id}/reject`,
+     type: 'PUT',
+     contentType: 'application/json',
+     data: JSON.stringify({ rejectionReason }),
+     success: function (data) {
+       if (data.success) {
+         alert('审核不通过');
+         location.reload();
+       }
+     },
+     error: function (error) {
+       alert('审核不通过失败');
+     }
+   });
+ }
+ function withdrawArticle(id) {
+   if (confirm('确定要撤回这篇文章吗？')) {
+     $.ajax({
+       url: `/admin/articles/${id}/withdraw`,
+       type: 'PUT',
+       success: function (data) {
+         if (data.success) {
+           alert('文章已撤回');
+           location.reload();
+         }
+       },
+       error: function (error) {
+         alert('撤回文章失败');
+       }
+     });
+   }
+ }
  function deleteArticle(id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
            const query = params.toString();
            window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>
7.发送审核通知
npm install @nestjs/event-emitter eventemitter2
7.1. notification.service.ts
src/shared/services/notification.service.ts

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ArticleService } from 'src/shared/services/article.service';
import { UserService } from 'src/shared/services/user.service';

@Injectable()
export class NotificationService {
    constructor(
        private readonly articleService: ArticleService,
        private readonly userService: UserService,
    ) { }

    @OnEvent('article.submitted')
    async handleArticleSubmittedEvent(payload: { articleId: number }) {
        const article = await this.articleService.findOne({ where: { id: payload.articleId }, relations: ['categories', 'tags'] });
        const admin = await this.userService.findOne({ where: { is_super: true } });
        if (admin) {
            const subject = `文章审核请求: ${article.title}`;
            const body = `有一篇新的文章需要审核，点击链接查看详情: http://localhost:3000/admin/articles/${payload.articleId}`;
            console.log(admin.email, subject, body);
        }
    }
}

7.2. app.module.ts
src/app.module.ts

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { ApiModule } from './api/api.module';
import { SharedModule } from './shared/shared.module';
import { AcceptLanguageResolver, QueryResolver, I18nModule, } from 'nestjs-i18n';
+import * as  path from 'path';
+import methodOverride from 'src/shared/middlewares/method-override'
+import { ServeStaticModule } from '@nestjs/serve-static';
+import { EventEmitterModule } from '@nestjs/event-emitter';
+@Module({
+ imports: [
+   // 配置 EventEmitterModule 模块
+   EventEmitterModule.forRoot({
+     // 启用通配符功能，允许使用通配符来订阅事件
+     wildcard: true,
+     // 设置事件名的分隔符，这里使用 '.' 作为分隔符
+     delimiter: '.',
+     // 将事件发射器设置为全局模块，所有模块都可以共享同一个事件发射器实例
+     global: true
+   }),
+   ServeStaticModule.forRoot({
+     rootPath: path.join(__dirname, '..', 'uploads'),
+     serveRoot: '/uploads',
+   }),
+   I18nModule.forRoot({
+     fallbackLanguage: 'en',
+     loaderOptions: {
+       path: path.join(__dirname, '/i18n/'),
+       watch: true
+     },
+     resolvers: [
+       new QueryResolver(["lang", "l"]),
+       AcceptLanguageResolver,
+     ]
+   }),
+   SharedModule,
+   AdminModule,
+   ApiModule
+ ],
+ controllers: [],
+ providers: [],
+})
+export class AppModule implements NestModule {
+ configure(consumer: MiddlewareConsumer) {
+   consumer.apply(methodOverride).forRoutes('*');
+ }
+}
+
7.3. article.entity.ts
src/shared/entities/article.entity.ts

import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { ArticleStateEnum } from '../enums/article.enum';
@Entity()
export class Article {
    @PrimaryGeneratedColumn()
    @ApiProperty({ description: 'ID', example: 1 })
    id: number;
+   @Column({ length: 50 })
    @ApiProperty({ description: '标题', example: '文章标题' })
    title: string;
    @Column('text')
    @ApiProperty({ description: '内容', example: '文章内容' })
    content: string;
    @ManyToMany(() => Category)
    @JoinTable()
    categories: Category[];
    @ManyToMany(() => Tag)
    @JoinTable()
    tags: Tag[];

    @Column({ type: 'enum', enum: ArticleStateEnum, default: 'draft' })
    @ApiProperty({ description: '文章状态', example: 'draft' })
    state: ArticleStateEnum;

    @Column({ type: 'text', nullable: true })
    @ApiProperty({ description: '审核不通过原因', example: '内容不符合要求' })
    rejectionReason: string;

    @Column({ default: 1 })
    @ApiProperty({ description: '生效状态', example: 1 })
    status: number;
    @Column({ default: 100 })
    @ApiProperty({ description: '排序号', example: 100 })
    sort: number;
    @CreateDateColumn()
    @ApiProperty({ description: '创建时间', example: '2024年8月11日16:49:22' })
    createdAt: Date;
    @UpdateDateColumn()
    @ApiProperty({ description: '更新时间', example: '2024年8月11日16:49:22' })
    updatedAt: Date;
}

7.4. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
+import { NotificationService } from './services/notification.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

7.5. article.controller.ts
src/admin/controllers/article.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, HttpException, Param, ParseIntPipe, Put, Delete, Headers, Res, Query, NotFoundException } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from 'src/shared/dto/article.dto';
import { ArticleService } from 'src/shared/services/article.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
import { CategoryService } from 'src/shared/services/category.service';
import { TagService } from 'src/shared/services/tag.service';
import { ArticleStateEnum } from 'src/shared/enums/article.enum';
+import { EventEmitter2 } from '@nestjs/event-emitter';
@UseFilters(AdminExceptionFilter)
@Controller('admin/articles')
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService,
+       private readonly eventEmitter: EventEmitter2,
    ) { }
    @Get()
    @Render('article/article-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { articles, total } = await this.articleService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
        return { articles, keyword, page, limit, pageCount };
    }
    @Get('create')
    @Render('article/article-form')
    async createForm() {
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article: { categories: [], tags: [] }, categoryTree, tags };
    }
    @Post()
    @Redirect('/admin/articles')
    async create(@Body() createArticleDto: CreateArticleDto) {
        await this.articleService.create(createArticleDto);
        return { success: true }
    }
    @Get(':id/edit')
    @Render('article/article-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article, categoryTree, tags };
    }
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateArticleDto: UpdateArticleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        updateArticleDto.state = ArticleStateEnum.DRAFT;
        await this.articleService.update(id, updateArticleDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/articles`);
        }
    }
    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.delete(id);
        return { success: true }
    }
    @Get(':id')
    @Render('article/article-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        return { article };
    }

    @Put(':id/submit')
    async submitForReview(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.PENDING });
+       this.eventEmitter.emit('article.submitted', { articleId: id });
        return { success: true };
    }

    @Put(':id/approve')
    async approveArticle(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.PUBLISHED, rejectionReason: null });
        return { success: true };
    }

    @Put(':id/reject')
    async rejectArticle(
        @Param('id', ParseIntPipe) id: number,
        @Body('rejectionReason') rejectionReason: string
    ) {
        await this.articleService.update(id, { state: ArticleStateEnum.REJECTED, rejectionReason });
        return { success: true };
    }

    @Put(':id/withdraw')
    async withdrawArticle(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.WITHDRAWN });
        return { success: true };
    }
}
8.发送邮件
npm install nodemailer
8.1. mail.service.ts
src/shared/services/mail.service.ts

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class MailService {
    private transporter;
    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: configService.get('SMTP_HOST'),
            port: configService.get('SMTP_PORT'),
            secure: true,
            auth: {
                user: configService.get('SMTP_USER'),
                pass: configService.get('SMTP_PASS'),
            },
        });
    }

    async sendEmail(to: string, subject: string, body: string) {
        const mailOptions = {
            from: this.configService.get('SMTP_USER'), // 发件人
            to, // 收件人
            subject, // 主题
            text: body, // 邮件正文
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`邮件已发送: ${info.messageId}`);
        } catch (error) {
            console.error(`发送邮件失败: ${error.message}`);
        }
    }
}

8.2. notification.service.ts
src/shared/services/notification.service.ts

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ArticleService } from 'src/shared/services/article.service';
import { UserService } from 'src/shared/services/user.service';
+import { MailService } from './mail.service';
@Injectable()
export class NotificationService {
    constructor(
        private readonly articleService: ArticleService,
        private readonly userService: UserService,
+       private readonly mailService: MailService,
    ) { }

    @OnEvent('article.submitted')
    async handleArticleSubmittedEvent(payload: { articleId: number }) {
        const article = await this.articleService.findOne({ where: { id: payload.articleId }, relations: ['categories', 'tags'] });
        const admin = await this.userService.findOne({ where: { is_super: true } });
        if (admin) {
            const subject = `文章审核请求: ${article.title}`;
            const body = `有一篇新的文章需要审核，点击链接查看详情: http://localhost:3000/admin/articles/${payload.articleId}`;
            console.log(admin.email, subject, body);
+           this.mailService.sendEmail(admin.email, subject, body);
        }
    }
}

8.3. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
+import { MailService } from './services/mail.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}
9.导出Word
npm install html-to-docx
res.setHeader('Content-Disposition', 'attachment; filename="articles.docx"'); 是一个关键的 HTTP 头设置，用于控制文件下载行为。通过它，你可以指定返回给客户端的文件名，并确保文件以附件形式下载。

9.1. word-export.service.ts
src/shared/services/word-export.service.ts

import { Injectable } from '@nestjs/common';
import * as htmlToDocx from 'html-to-docx';

@Injectable()
export class WordExportService {
    async exportToWord(htmlContent: string): Promise<Buffer> {
        return await htmlToDocx(htmlContent);
    }
}

9.2. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
+import { WordExportService } from './services/word-export.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

9.3. article-detail.hbs
views/article/article-detail.hbs

<h1>
    文章详情
</h1>
<div class="mb-3">
    <label class="form-label">标题:</label>
    <p class="form-control-plaintext">{{article.title}}</p>
</div>
<div class="mb-3">
    <label class="form-label">内容:</label>
    <div class="form-control-plaintext">
        {{{article.content}}}
    </div>
</div>
<div class="mb-3">
    <label class="form-label">分类:</label>
    <p class="form-control-plaintext">
        {{#each article.categories}}
        <span class="badge bg-secondary">{{this.name}}</span>
        {{/each}}
    </p>
</div>
<div class="mb-3">
    <label class="form-label">标签:</label>
    <p class="form-control-plaintext">
        {{#each article.tags}}
        <span class="badge bg-info text-dark">{{this.name}}</span>
        {{/each}}
    </p>
</div>
<div class="mb-3">
    <label class="form-label">状态:</label>
    <p class="form-control-plaintext">
        {{#if (eq article.state 'draft')}}草稿{{/if}}
        {{#if (eq article.state 'pending')}}待审核{{/if}}
        {{#if (eq article.state 'published')}}已发布{{/if}}
        {{#if (eq article.state 'rejected')}}审核不通过{{/if}}
    </p>
</div>
{{#if (eq article.state 'rejected')}}
<div class="mb-3">
    <label class="form-label">不通过原因:</label>
    <p class="form-control-plaintext">{{article.rejectionReason}}</p>
</div>
{{/if}}
{{#if (eq article.state 'pending')}}
<div class="mb-3">
    <button id="approveButton" class="btn btn-success">审核通过</button>
    <button id="rejectButton" class="btn btn-danger">审核不通过</button>
</div>
{{/if}}
<a href="/admin/articles/{{article.id}}/edit" class="btn btn-warning btn-sm">修改</a>
<a href="/admin/articles" class="btn btn-secondary btn-sm">返回列表</a>
+<a href="/admin/articles/{{article.id}}/export-word" class="btn btn-primary btn-sm">导出为 Word</a>
<div id="rejectionReasonModal" class="modal fade" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">填写审核不通过原因</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
            </div>
            <div class="modal-body">
                <textarea id="rejectionReason" class="form-control" rows="3" placeholder="请输入不通过原因"></textarea>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button id="confirmRejectionButton" type="button" class="btn btn-danger">确认不通过</button>
            </div>
        </div>
    </div>
</div>
<script>
    $(function () {
        $('#approveButton').on('click', function () {
            if (confirm('确定要通过审核吗？')) {
                $.ajax({
                    url: `/admin/articles/{{article.id}}/approve`,
                    type: 'PUT',
                    success: function (data) {
                        if (data.success) {
                            alert('审核通过');
                            location.reload();
                        } else {
                            alert('审核通过失败');
                        }
                    },
                    error: function () {
                        alert('审核通过失败');
                    }
                });
            }
        });

        $('#rejectButton').on('click', function () {
            $('#rejectionReasonModal').modal('show');
        });

        $('#confirmRejectionButton').on('click', function () {
            const rejectionReason = $('#rejectionReason').val().trim();
            if (rejectionReason === '') {
                alert('请填写审核不通过的原因');
                return;
            }
            $.ajax({
                url: `/admin/articles/{{article.id}}/reject`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ rejectionReason: rejectionReason }),
                success: function (data) {
                    if (data.success) {
                        alert('审核不通过');
                        location.reload();
                    } else {
                        alert('审核不通过失败');
                    }
                },
                error: function () {
                    alert('审核不通过失败');
                }
            });
        });
    });
</script>
9.4. article.controller.ts
src/admin/controllers/article.controller.ts

+import { Controller, Get, Render, Post, Redirect, Body, UseFilters, Param, ParseIntPipe, Put, Delete, Headers, Res, Query, NotFoundException, Header, StreamableFile } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from 'src/shared/dto/article.dto';
import { ArticleService } from 'src/shared/services/article.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
import { CategoryService } from 'src/shared/services/category.service';
import { TagService } from 'src/shared/services/tag.service';
import { ArticleStateEnum } from 'src/shared/enums/article.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
+import { WordExportService } from 'src/shared/services/word-export.service';
@UseFilters(AdminExceptionFilter)
@Controller('admin/articles')
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService,
        private readonly eventEmitter: EventEmitter2,
+       private readonly wordExportService: WordExportService,
    ) { }
    @Get()
    @Render('article/article-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { articles, total } = await this.articleService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
        return { articles, keyword, page, limit, pageCount };
    }
    @Get('create')
    @Render('article/article-form')
    async createForm() {
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article: { categories: [], tags: [] }, categoryTree, tags };
    }
    @Post()
    @Redirect('/admin/articles')
    async create(@Body() createArticleDto: CreateArticleDto) {
        await this.articleService.create(createArticleDto);
        return { success: true }
    }
    @Get(':id/edit')
    @Render('article/article-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article, categoryTree, tags };
    }
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateArticleDto: UpdateArticleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        updateArticleDto.state = ArticleStateEnum.DRAFT;
        await this.articleService.update(id, updateArticleDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/articles`);
        }
    }
    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.delete(id);
        return { success: true }
    }
    @Get(':id')
    @Render('article/article-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        return { article };
    }

    @Put(':id/submit')
    async submitForReview(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.PENDING });
        this.eventEmitter.emit('article.submitted', { articleId: id });
        return { success: true };
    }

    @Put(':id/approve')
    async approveArticle(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.PUBLISHED, rejectionReason: null });
        return { success: true };
    }

    @Put(':id/reject')
    async rejectArticle(
        @Param('id', ParseIntPipe) id: number,
        @Body('rejectionReason') rejectionReason: string
    ) {
        await this.articleService.update(id, { state: ArticleStateEnum.REJECTED, rejectionReason });
        return { success: true };
    }

    @Put(':id/withdraw')
    async withdrawArticle(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.WITHDRAWN });
        return { success: true };
    }
+   @Get(':id/export-word')
+   @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
+   async exportWord(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
+       const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
+       if (!article) throw new NotFoundException('Article not found');
+
+       const htmlContent = `
+           <h1>${article.title}</h1>
+           <p><strong>状态:</strong> ${article.state}</p>
+           <p><strong>分类:</strong> ${article.categories.map(c => c.name).join(', ')}</p>
+           <p><strong>标签:</strong> ${article.tags.map(t => t.name).join(', ')}</p>
+           <hr/>
+           ${article.content}
+       `;
+
+       const buffer = await this.wordExportService.exportToWord(htmlContent);
+       res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(article.title)}.docx"`);
+       return new StreamableFile(buffer);
+   }
}
10.导出ppt
npm install html-pptxgenjs pptxgenjs 
10.1. ppt-export.service.ts
src/shared/services/ppt-export.service.ts

// 导入 Injectable 装饰器，用于标记一个服务类
import { Injectable } from '@nestjs/common';
// 导入 PptxGenJS 库，用于生成 PPTX 文件
import * as PptxGenJS from 'pptxgenjs';
// 导入 html-pptxgenjs 库，用于将 HTML 转换为 PPTX 内容
import * as html2ppt from 'html-pptxgenjs';
// 使用 Injectable 装饰器将 PptExportService 标记为可注入的服务
@Injectable()
export class PptExportService {
    // 异步方法，用于将文章列表导出为 PPTX 文件
    async exportToPpt(articles: any[]) {
        // 创建一个新的 PPTX 对象
        const pptx = new (PptxGenJS as any)();
        // 遍历每篇文章，将其内容添加到 PPTX 幻灯片中
        for (const article of articles) {
            // 添加一个新的幻灯片到 PPTX
            const slide = pptx.addSlide();
            // 构建 HTML 内容，包含文章标题、状态、分类、标签和正文内容
            const htmlContent = `
                <h1>${article.title}</h1>
                <p><strong>状态:</strong> ${article.state}</p>
                <p><strong>分类:</strong> ${article.categories.map(c => c.name).join(', ')}</p>
                <p><strong>标签:</strong> ${article.tags.map(t => t.name).join(', ')}</p>
                <hr/>
                ${article.content}
            `;
            // 使用 html-pptxgenjs 将 HTML 内容转换为 PPTX 可用的文本项
            const items = html2ppt.htmlToPptxText(htmlContent);
            // 将生成的文本项添加到幻灯片中，设置其位置和大小
            slide.addText(items, { x: 0.5, y: 0.5, w: 9.5, h: 6, valign: 'top' });
        }
        // 将生成的 PPTX 文件以 nodebuffer 的形式输出
        return await pptx.write({ outputType: 'nodebuffer' });
    }
}
10.2. admin-exception-filter.ts
src/admin/filters/admin-exception-filter.ts

import { ArgumentsHost, ExceptionFilter, HttpException, Catch, BadRequestException } from "@nestjs/common";
import { Response } from 'express';
import { I18nService, I18nValidationException } from "nestjs-i18n";
@Catch(HttpException)
export class AdminExceptionFilter implements ExceptionFilter {
    constructor(private readonly i18n: I18nService) { }
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request: any = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        let status = exception.getStatus();
        let message = exception.message;
        if (exception instanceof BadRequestException) {
            const execptionBody: any = exception.getResponse();
            if (typeof execptionBody === 'object' && execptionBody.message) {
+               message = Array.isArray(execptionBody.message) ? execptionBody.message.join(',') : execptionBody.message;
                status = execptionBody.statusCode;
            }
        } else if (exception instanceof I18nValidationException) {
            const errors = exception.errors;
            message = errors.map(error => this.formatErrorMessage(error, request.i18nLang)).join(';')
        }
        response.status(status).render('error', {
            message
        });
    }
    formatErrorMessage(error, lang) {
        const { property, value, constraints } = error;
        const constraintValues = Object.values(constraints)
        const formattedMessages = constraintValues.map((constraintValue: any) => {
            const [key, params] = constraintValue.split('|');
            if (params) {
                const parsedParams = JSON.parse(params);
                return this.i18n.translate(key, {
                    lang,
                    args: parsedParams
                });
            }
        })
        return `${property}:${value} ${formattedMessages.join(',')}`
    }
}

10.3. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { WordExportService } from './services/word-export.service';
+import { PptExportService } from './services/ppt-export.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

10.4. article.controller.ts
src/admin/controllers/article.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, Param, ParseIntPipe, Put, Delete, Headers, Res, Query, NotFoundException, Header, StreamableFile } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from 'src/shared/dto/article.dto';
import { ArticleService } from 'src/shared/services/article.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
import { CategoryService } from 'src/shared/services/category.service';
import { TagService } from 'src/shared/services/tag.service';
import { ArticleStateEnum } from 'src/shared/enums/article.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WordExportService } from 'src/shared/services/word-export.service';
+import { PptExportService } from 'src/shared/services/ppt-export.service';
@UseFilters(AdminExceptionFilter)
@Controller('admin/articles')
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService,
        private readonly eventEmitter: EventEmitter2,
        private readonly wordExportService: WordExportService,
+       private readonly pptExportService: PptExportService
    ) { }
+
+   @Get(':id/export-word')
+   @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
+   async exportWord(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
+       const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
+       if (!article) throw new NotFoundException('Article not found');
+       const htmlContent = `
+           <h1>${article.title}</h1>
+           <p><strong>状态:</strong> ${article.state}</p>
+           <p><strong>分类:</strong> ${article.categories.map(c => c.name).join(', ')}</p>
+           <p><strong>标签:</strong> ${article.tags.map(t => t.name).join(', ')}</p>
+           <hr/>
+           ${article.content}
+       `;
+
+       const buffer = await this.wordExportService.exportToWord(htmlContent);
+       res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(article.title)}.docx"`);
+       return new StreamableFile(buffer);
+   }
+
+   @Get('export-ppt')
+   @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
+   async exportPpt(@Query('search') search: string = '', @Query('page', new ParseOptionalIntPipe(1)) page: number, @Query('limit', new ParseOptionalIntPipe(10)) limit: number, @Res({ passthrough: true }) res: Response) {
+       const { articles } = await this.articleService.findAllWithPagination(page, limit, search);
+       const buffer = await this.pptExportService.exportToPpt(articles);
+       res.setHeader('Content-Disposition', 'attachment; filename=articles.pptx');
+       return new StreamableFile(buffer);
+   }
    @Get()
    @Render('article/article-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { articles, total } = await this.articleService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
        return { articles, keyword, page, limit, pageCount };
    }
    @Get('create')
    @Render('article/article-form')
    async createForm() {
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article: { categories: [], tags: [] }, categoryTree, tags };
    }
    @Post()
    @Redirect('/admin/articles')
    async create(@Body() createArticleDto: CreateArticleDto) {
        await this.articleService.create(createArticleDto);
        return { success: true }
    }
    @Get(':id/edit')
    @Render('article/article-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article, categoryTree, tags };
    }
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateArticleDto: UpdateArticleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        updateArticleDto.state = ArticleStateEnum.DRAFT;
        await this.articleService.update(id, updateArticleDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/articles`);
        }
    }
    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.delete(id);
        return { success: true }
    }
    @Get(':id')
    @Render('article/article-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        return { article };
    }

    @Put(':id/submit')
    async submitForReview(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.PENDING });
        this.eventEmitter.emit('article.submitted', { articleId: id });
        return { success: true };
    }

    @Put(':id/approve')
    async approveArticle(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.PUBLISHED, rejectionReason: null });
        return { success: true };
    }

    @Put(':id/reject')
    async rejectArticle(
        @Param('id', ParseIntPipe) id: number,
        @Body('rejectionReason') rejectionReason: string
    ) {
        await this.articleService.update(id, { state: ArticleStateEnum.REJECTED, rejectionReason });
        return { success: true };
    }

    @Put(':id/withdraw')
    async withdrawArticle(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.WITHDRAWN });
        return { success: true };
    }
}

10.5. article-list.hbs
views/article/article-list.hbs

<h1>
  文章列表
</h1>
+<a href="/admin/articles/create" class="btn btn-success btn-sm mb-3">添加文章</a>
+<button id="exportPptBtn" class="btn btn-warning btn-sm mb-3">导出PPT</button>
<form method="GET" action="/admin/articles" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
<table class="table">
  <thead>
    <tr>
      <th>标题</th>
      <th>分类</th>
      <th>标签</th>
      <th>文章状态</th>
      <td>状态</td>
      <td>排序</td>
      <td>操作</td>
    </tr>
  </thead>
  <tbody>
    {{#each articles}}
    <tr>
      <td>{{this.title}}</td>
      <td>
        {{#each this.categories}}
        <span class="badge bg-secondary">{{this.name}}</span>
        {{/each}}
      </td>
      <td>
        {{#each this.tags}}
        <span class="badge bg-info text-dark">{{this.name}}</span>
        {{/each}}
      </td>
      <td>
        {{#if (eq this.state 'draft')}}
        <span class="badge bg-secondary">草稿</span>
        {{/if}}

        {{#if (eq this.state 'pending')}}
        <span class="badge bg-warning text-dark">待审核</span>
        {{/if}}

        {{#if (eq this.state 'published')}}
        <span class="badge bg-success">已发布</span>
        {{/if}}

        {{#if (eq this.state 'rejected')}}
        <span class="badge bg-danger">审核不通过</span>
        {{/if}}

        {{#if (eq this.state 'withdrawn')}}
        <span class="badge bg-dark">已撤回</span>
        {{/if}}
      </td>
      <td>
        <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
          {{#if this.status}}
          <i class="bi bi-check-circle-fill text-success"></i>
          {{else}}
          <i class="bi bi-x-circle-fill text-danger"></i>
          {{/if}}
        </span>
      </td>
      <td>
        <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
        <input type="number" class="form-control sort-input d-none" style="width:50%" data-id="{{this.id}}"
          value="{{this.sort}}">
      </td>
      <td>
        <a href="/admin/articles/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
        <a href="/admin/articles/{{this.id}}/edit" class="btn btn-warning btn-sm">修改</a>
        <a class="btn btn-danger btn-sm" onclick="deleteArticle({{this.id}})">删除</a>
        {{#if (eq this.state 'draft')}}
        <button class="btn btn-warning btn-sm" onclick="submitForReview({{this.id}})">提交审核</button>
        {{/if}}
        {{#if (eq this.state 'pending')}}
        <button class="btn btn-success btn-sm" onclick="approveArticle({{this.id}})">审核通过</button>
        <button class="btn btn-danger btn-sm" data-bs-toggle="modal"
          data-bs-target="#rejectModal-{{this.id}}">审核不通过</button>
        <div class="modal fade" id="rejectModal-{{this.id}}" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">审核不通过</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label for="rejectionReason-{{this.id}}" class="form-label">不通过原因</label>
                  <textarea class="form-control" id="rejectionReason-{{this.id}}" name="rejectionReason"
                    rows="3"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-danger" onclick="rejectArticle({{this.id}})">提交</button>
              </div>
            </div>
          </div>
        </div>
        {{/if}}
        {{#if (eq this.state 'published')}}
        <button class="btn btn-secondary btn-sm" onclick="withdrawArticle({{this.id}})">撤回</button>
        {{/if}}
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>
<nav>
  <ul class="pagination">
    <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
      <a class="page-link" href="?page={{dec page}}&keyword={{keyword}}&limit={{limit}}">上一页</a>
    </li>
    {{#each (range 1 pageCount)}}
    <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
      <a class="page-link" href="?page={{this}}&keyword={{../keyword}}&limit={{../limit}}">{{this}}</a>
    </li>
    {{/each}}

    <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
      <a class="page-link" href="?page={{inc page}}&keyword={{keyword}}&limit={{limit}}">下一页</a>
    </li>
    <li class="page-item">
      <form method="GET" action="/admin/articles" class="d-inline-block ms-3">
        <input type="hidden" name="keyword" value="{{keyword}}">
        <input type="hidden" name="page" value="{{page}}">
        <div class="input-group">
          <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
          <button class="btn btn-outline-secondary" type="submit">设置每页的条数</button>
        </div>
      </form>
    </li>
  </ul>
</nav>
<script>
  function submitForReview(id) {
    if (confirm('确定要提交审核吗？')) {
      $.ajax({
        url: `/admin/articles/${id}/submit`,
        type: 'PUT',
        success: function (data) {
          if (data.success) {
            alert('提交审核成功');
            location.reload();
          }
        },
        error: function (error) {
          alert('提交审核失败');
        }
      });
    }
  }

  function approveArticle(id) {
    if (confirm('确定要通过审核吗？')) {
      $.ajax({
        url: `/admin/articles/${id}/approve`,
        type: 'PUT',
        success: function (data) {
          if (data.success) {
            alert('审核通过');
            location.reload();
          }
        },
        error: function (error) {
          alert('审核通过失败');
        }
      });
    }
  }

  function rejectArticle(id) {
    const rejectionReason = $(`#rejectionReason-${id}`).val();
    if (rejectionReason.trim() === '') {
      alert('请填写审核不通过的原因');
      return;
    }
    $.ajax({
      url: `/admin/articles/${id}/reject`,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ rejectionReason }),
      success: function (data) {
        if (data.success) {
          alert('审核不通过');
          location.reload();
        }
      },
      error: function (error) {
        alert('审核不通过失败');
      }
    });
  }
  function withdrawArticle(id) {
    if (confirm('确定要撤回这篇文章吗？')) {
      $.ajax({
        url: `/admin/articles/${id}/withdraw`,
        type: 'PUT',
        success: function (data) {
          if (data.success) {
            alert('文章已撤回');
            location.reload();
          }
        },
        error: function (error) {
          alert('撤回文章失败');
        }
      });
    }
  }
  function deleteArticle(id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
            const query = params.toString();
            window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
+   $('#exportPptBtn').click(function () {
+     window.location.href = `/admin/articles/export-ppt?page={{page}}&search={{search}}&limit={{limit}}`;
+   });
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>
11.导出Excel
npm i exceljs
11.1. excel-export.service.ts
src/shared/services/excel-export.service.ts

// 导入 Injectable 装饰器，用于将服务类标记为可注入的依赖
import { Injectable } from '@nestjs/common';
// 导入 ExcelJS 库，用于创建和操作 Excel 文件
import * as ExcelJS from 'exceljs';
@Injectable()
export class ExcelExportService {
    // 异步方法，用于将数据导出为 Excel 文件
    async exportAsExcel(data: any[], columns: { header: string, key: string, width: number }[]) {
        // 创建一个新的 Excel 工作簿
        const workbook = new ExcelJS.Workbook();
        // 添加一个新的工作表，并命名为 'Data'
        const worksheet = workbook.addWorksheet('Data');
        // 设置工作表的列，根据传入的列定义数组
        worksheet.columns = columns;
        // 遍历数据数组，将每一项数据作为一行添加到工作表中
        data.forEach(item => {
            worksheet.addRow(item);
        });
        // 将工作簿内容写入缓冲区，并返回该缓冲区（用于进一步处理或保存）
        return workbook.xlsx.writeBuffer();
    }
}
11.2. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { WordExportService } from './services/word-export.service';
import { PptExportService } from './services/ppt-export.service';
+import { ExcelExportService } from './services/excel-export.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

11.3. article.controller.ts
src/admin/controllers/article.controller.ts

import { Controller, Get, Render, Post, Redirect, Body, UseFilters, Param, ParseIntPipe, Put, Delete, Headers, Res, Query, NotFoundException, Header, StreamableFile } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from 'src/shared/dto/article.dto';
import { ArticleService } from 'src/shared/services/article.service';
import { AdminExceptionFilter } from '../filters/admin-exception-filter';
import { Response } from 'express';
import { ParseOptionalIntPipe } from 'src/shared/pipes/parse-optional-int.pipe';
import { CategoryService } from 'src/shared/services/category.service';
import { TagService } from 'src/shared/services/tag.service';
import { ArticleStateEnum } from 'src/shared/enums/article.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WordExportService } from 'src/shared/services/word-export.service';
import { PptExportService } from 'src/shared/services/ppt-export.service';
+import { ExcelExportService } from 'src/shared/services/excel-export.service';
@UseFilters(AdminExceptionFilter)
@Controller('admin/articles')
export class ArticleController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService,
        private readonly eventEmitter: EventEmitter2,
        private readonly wordExportService: WordExportService,
+       private readonly pptExportService: PptExportService,
+       private readonly excelExportService: ExcelExportService,
    ) { }
+   @Get('export-excel')
+   @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
+   async exportExcel(@Query('search') search: string = '', @Query('page', new ParseOptionalIntPipe(1)) page: number, @Query('limit', new ParseOptionalIntPipe(10)) limit: number, @Res({ passthrough: true }) res: Response) {
+       const { articles } = await this.articleService.findAllWithPagination(page, limit, search);
+       const data = articles.map(article => ({
+           title: article.title,
+           categories: article.categories.map(c => c.name).join(', '),
+           tags: article.tags.map(t => t.name).join(', '),
+           state: article.state,
+           createdAt: article.createdAt,
+       }));
+       const columns = [
+           { header: '标题', key: 'title', width: 30 },
+           { header: '分类', key: 'categories', width: 20 },
+           { header: '标签', key: 'tags', width: 20 },
+           { header: '状态', key: 'state', width: 15 },
+           { header: '创建时间', key: 'createdAt', width: 20 },
+       ];
+       const buffer = await this.excelExportService.exportAsExcel(data, columns);
+       res.setHeader('Content-Disposition', `attachment; filename="articles.xlsx"`);
+       return new StreamableFile(new Uint8Array(buffer));
+   }
    @Get(':id/export-word')
    @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    async exportWord(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not found');
        const htmlContent = `
            <h1>${article.title}</h1>
            <p><strong>状态:</strong> ${article.state}</p>
            <p><strong>分类:</strong> ${article.categories.map(c => c.name).join(', ')}</p>
            <p><strong>标签:</strong> ${article.tags.map(t => t.name).join(', ')}</p>
            <hr/>
            ${article.content}
        `;

        const buffer = await this.wordExportService.exportToWord(htmlContent);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(article.title)}.docx"`);
        return new StreamableFile(buffer);
    }

    @Get('export-ppt')
    @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
    async exportPpt(@Query('search') search: string = '', @Query('page', new ParseOptionalIntPipe(1)) page: number, @Query('limit', new ParseOptionalIntPipe(10)) limit: number, @Res({ passthrough: true }) res: Response) {
        const { articles } = await this.articleService.findAllWithPagination(page, limit, search);
        const buffer = await this.pptExportService.exportToPpt(articles);
        res.setHeader('Content-Disposition', 'attachment; filename=articles.pptx');
        return new StreamableFile(buffer);
    }
    @Get()
    @Render('article/article-list')
    async findAll(@Query('keyword') keyword: string = '',
        @Query('page', new ParseOptionalIntPipe(1)) page: number,
        @Query('limit', new ParseOptionalIntPipe(10)) limit: number) {
        const { articles, total } = await this.articleService.findAllWithPagination(page, limit, keyword);
        const pageCount = Math.ceil(total / limit);
        return { articles, keyword, page, limit, pageCount };
    }
    @Get('create')
    @Render('article/article-form')
    async createForm() {
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article: { categories: [], tags: [] }, categoryTree, tags };
    }
    @Post()
    @Redirect('/admin/articles')
    async create(@Body() createArticleDto: CreateArticleDto) {
        await this.articleService.create(createArticleDto);
        return { success: true }
    }
    @Get(':id/edit')
    @Render('article/article-form')
    async editForm(@Param('id', ParseIntPipe) id: number) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        const categoryTree = await this.categoryService.findAll();
        const tags = await this.tagService.findAll();
        return { article, categoryTree, tags };
    }
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateArticleDto: UpdateArticleDto, @Res({ passthrough: true }) res: Response, @Headers('accept') accept: string) {
        updateArticleDto.state = ArticleStateEnum.DRAFT;
        await this.articleService.update(id, updateArticleDto);
        if (accept === 'application/json') {
            return { success: true };
        } else {
            return res.redirect(`/admin/articles`);
        }
    }
    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.delete(id);
        return { success: true }
    }
    @Get(':id')
    @Render('article/article-detail')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const article = await this.articleService.findOne({ where: { id }, relations: ['categories', 'tags'] });
        if (!article) throw new NotFoundException('Article not Found');
        return { article };
    }

    @Put(':id/submit')
    async submitForReview(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.PENDING });
        this.eventEmitter.emit('article.submitted', { articleId: id });
        return { success: true };
    }

    @Put(':id/approve')
    async approveArticle(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.PUBLISHED, rejectionReason: null });
        return { success: true };
    }

    @Put(':id/reject')
    async rejectArticle(
        @Param('id', ParseIntPipe) id: number,
        @Body('rejectionReason') rejectionReason: string
    ) {
        await this.articleService.update(id, { state: ArticleStateEnum.REJECTED, rejectionReason });
        return { success: true };
    }

    @Put(':id/withdraw')
    async withdrawArticle(@Param('id', ParseIntPipe) id: number) {
        await this.articleService.update(id, { state: ArticleStateEnum.WITHDRAWN });
        return { success: true };
    }
}

11.4. article-list.hbs
views/article/article-list.hbs

<h1>
  文章列表
</h1>
<a href="/admin/articles/create" class="btn btn-success btn-sm mb-3">添加文章</a>
<button id="exportPptBtn" class="btn btn-warning btn-sm mb-3">导出PPT</button>
+<button id="frontExportBtn" class="btn btn-info btn-sm mb-3">前台导出Excel</button>
+<button id="backendExportBtn" class="btn btn-info btn-sm mb-3">后台导出Excel</button>
<form method="GET" action="/admin/articles" class="mb-3">
  <div class="input-group">
    <input type="text" name="keyword" class="form-control" placeholder="请输入搜索关键字" value="{{keyword}}">
    <button class="btn btn-outline-secondary">搜索</button>
  </div>
</form>
+<table class="table" id="articleTable">
  <thead>
    <tr>
      <th>标题</th>
      <th>分类</th>
      <th>标签</th>
      <th>文章状态</th>
+     <th>状态</th>
+     <th>排序</th>
+     <th>操作</th>
    </tr>
  </thead>
  <tbody>
    {{#each articles}}
    <tr>
      <td>{{this.title}}</td>
      <td>
        {{#each this.categories}}
        <span class="badge bg-secondary">{{this.name}}</span>
        {{/each}}
      </td>
      <td>
        {{#each this.tags}}
        <span class="badge bg-info text-dark">{{this.name}}</span>
        {{/each}}
      </td>
      <td>
        {{#if (eq this.state 'draft')}}
        <span class="badge bg-secondary">草稿</span>
        {{/if}}

        {{#if (eq this.state 'pending')}}
        <span class="badge bg-warning text-dark">待审核</span>
        {{/if}}

        {{#if (eq this.state 'published')}}
        <span class="badge bg-success">已发布</span>
        {{/if}}

        {{#if (eq this.state 'rejected')}}
        <span class="badge bg-danger">审核不通过</span>
        {{/if}}

        {{#if (eq this.state 'withdrawn')}}
        <span class="badge bg-dark">已撤回</span>
        {{/if}}
      </td>
      <td>
        <span class="status-toggle" data-id="{{this.id}}" data-status="{{this.status}}">
          {{#if this.status}}
          <i class="bi bi-check-circle-fill text-success"></i>
          {{else}}
          <i class="bi bi-x-circle-fill text-danger"></i>
          {{/if}}
        </span>
      </td>
      <td>
        <span class="sort-text" data-id="{{this.id}}">{{this.sort}}</span>
        <input type="number" class="form-control sort-input d-none" style="width:50%" data-id="{{this.id}}"
          value="{{this.sort}}">
      </td>
      <td>
        <a href="/admin/articles/{{this.id}}" class="btn btn-primary btn-sm">查看</a>
        <a href="/admin/articles/{{this.id}}/edit" class="btn btn-warning btn-sm">修改</a>
        <a class="btn btn-danger btn-sm" onclick="deleteArticle({{this.id}})">删除</a>
        {{#if (eq this.state 'draft')}}
        <button class="btn btn-warning btn-sm" onclick="submitForReview({{this.id}})">提交审核</button>
        {{/if}}
        {{#if (eq this.state 'pending')}}
        <button class="btn btn-success btn-sm" onclick="approveArticle({{this.id}})">审核通过</button>
        <button class="btn btn-danger btn-sm" data-bs-toggle="modal"
          data-bs-target="#rejectModal-{{this.id}}">审核不通过</button>
        <div class="modal fade" id="rejectModal-{{this.id}}" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">审核不通过</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label for="rejectionReason-{{this.id}}" class="form-label">不通过原因</label>
                  <textarea class="form-control" id="rejectionReason-{{this.id}}" name="rejectionReason"
                    rows="3"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-danger" onclick="rejectArticle({{this.id}})">提交</button>
              </div>
            </div>
          </div>
        </div>
        {{/if}}
        {{#if (eq this.state 'published')}}
        <button class="btn btn-secondary btn-sm" onclick="withdrawArticle({{this.id}})">撤回</button>
        {{/if}}
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>
<nav>
  <ul class="pagination">
    <li class="page-item {{#if (eq page 1)}}disabled{{/if}}">
      <a class="page-link" href="?page={{dec page}}&keyword={{keyword}}&limit={{limit}}">上一页</a>
    </li>
    {{#each (range 1 pageCount)}}
    <li class="page-item {{#if (eq this ../page)}}active{{/if}}">
      <a class="page-link" href="?page={{this}}&keyword={{../keyword}}&limit={{../limit}}">{{this}}</a>
    </li>
    {{/each}}

    <li class="page-item {{#if (eq page pageCount)}}disabled{{/if}}">
      <a class="page-link" href="?page={{inc page}}&keyword={{keyword}}&limit={{limit}}">下一页</a>
    </li>
    <li class="page-item">
      <form method="GET" action="/admin/articles" class="d-inline-block ms-3">
        <input type="hidden" name="keyword" value="{{keyword}}">
        <input type="hidden" name="page" value="{{page}}">
        <div class="input-group">
          <input type="number" name="limit" class="form-control" placeholder="每页条数" value="{{limit}}" min="1">
          <button class="btn btn-outline-secondary" type="submit">设置每页的条数</button>
        </div>
      </form>
    </li>
  </ul>
</nav>
<script>
  function submitForReview(id) {
    if (confirm('确定要提交审核吗？')) {
      $.ajax({
        url: `/admin/articles/${id}/submit`,
        type: 'PUT',
        success: function (data) {
          if (data.success) {
            alert('提交审核成功');
            location.reload();
          }
        },
        error: function (error) {
          alert('提交审核失败');
        }
      });
    }
  }

  function approveArticle(id) {
    if (confirm('确定要通过审核吗？')) {
      $.ajax({
        url: `/admin/articles/${id}/approve`,
        type: 'PUT',
        success: function (data) {
          if (data.success) {
            alert('审核通过');
            location.reload();
          }
        },
        error: function (error) {
          alert('审核通过失败');
        }
      });
    }
  }

  function rejectArticle(id) {
    const rejectionReason = $(`#rejectionReason-${id}`).val();
    if (rejectionReason.trim() === '') {
      alert('请填写审核不通过的原因');
      return;
    }
    $.ajax({
      url: `/admin/articles/${id}/reject`,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ rejectionReason }),
      success: function (data) {
        if (data.success) {
          alert('审核不通过');
          location.reload();
        }
      },
      error: function (error) {
        alert('审核不通过失败');
      }
    });
  }
  function withdrawArticle(id) {
    if (confirm('确定要撤回这篇文章吗？')) {
      $.ajax({
        url: `/admin/articles/${id}/withdraw`,
        type: 'PUT',
        success: function (data) {
          if (data.success) {
            alert('文章已撤回');
            location.reload();
          }
        },
        error: function (error) {
          alert('撤回文章失败');
        }
      });
    }
  }
  function deleteArticle(id) {
    if (confirm('确定要删除吗?')) {
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'DELETE',
        success: function (data) {
          if (data.success) {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            params.append('page', 1)
            const query = params.toString();
            window.location = window.location.pathname + '?' + query;
          }
        }
      })
    }
  }
  $(function () {
+   // 当用户点击 ID 为 backendExportBtn 的按钮时，触发事件处理函数
+   $('#backendExportBtn').click(function () {
+     // 将浏览器的窗口位置重定向到指定的导出 Excel 文件的 URL
+     // URL 中包含当前页面、搜索条件和限制参数
+     window.location.href = `/admin/articles/export-excel?page={{page}}&search={{search}}&limit={{limit}}`;
+   });

+   // 当用户点击 ID 为 frontExportBtn 的按钮时，触发事件处理函数
+   $('#frontExportBtn').click(function () {
+     // 初始化一个空的字符串，用于存储 CSV 文件内容
+     let csvContent = '';

+     // 遍历表格的表头行（thead 中的所有 tr），生成 CSV 文件的表头内容
+     $('#articleTable thead tr').each(function () {
+       let rowContent = ''; // 初始化空字符串，用于存储当前行的内容
+       let cells = $(this).find('th'); // 获取当前行中的所有 th 单元格
+       cells.each(function (index) {
+         if (index < cells.length - 1) { // 遍历时排除最后一列（假设不需要导出）
+           rowContent += $(this).text().trim() + ','; // 将单元格文本内容加入行内容，并用逗号分隔
+         }
+       });
+       csvContent += rowContent.slice(0, -1) + '\n'; // 移除最后一个多余的逗号并添加换行符
+     });

+     // 遍历表格的主体行（tbody 中的所有 tr），生成 CSV 文件的表格内容
+     $('#articleTable tbody tr').each(function () {
+       let rowContent = ''; // 初始化空字符串，用于存储当前行的内容
+       let cells = $(this).find('td'); // 获取当前行中的所有 td 单元格
+       cells.each(function (index) {
+         if (index < cells.length - 1) { // 遍历时排除最后一列（假设不需要导出）
+           rowContent += $(this).text().trim().replace(/,/g, '') + ','; // 将单元格文本内容加入行内容，并用逗号分隔，替换掉内容中的逗号以避免干扰 CSV 格式
+         }
+       });
+       csvContent += rowContent.slice(0, -1) + '\n'; // 移除最后一个多余的逗号并添加换行符
+     });

+     // 创建一个 Blob 对象，包含生成的 CSV 内容，类型为 text/csv，并设置字符编码为 UTF-8
+     let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

+     // 创建一个指向 Blob 对象的 URL
+     let url = URL.createObjectURL(blob);

+     // 创建一个隐藏的 <a> 元素，并设置其 href 属性为 Blob URL，设置下载文件名为 articles.csv
+     let link = $('<a>').attr({
+       href: url,
+       download: 'articles.csv'
+     }).appendTo('body'); // 将链接元素临时添加到文档的 body 中

+     // 模拟点击 <a> 元素以触发下载
+     link[0].click();

+     // 移除临时添加的 <a> 元素
+     link.remove();
+   });
    $('#exportPptBtn').click(function () {
      window.location.href = `/admin/articles/export-ppt?page={{page}}&search={{search}}&limit={{limit}}`;
    });
    $('.sort-text').on('dblclick', function () {
      const $this = $(this);
      const id = $this.data('id');
      $this.addClass('d-none');
      $(`.sort-input[data-id="${id}"]`).removeClass('d-none').focus();
    });
    $('.sort-input').on('blur', function () {
      const $this = $(this);
      const id = $this.data('id');
      const newSort = $this.val();
      $this.addClass('d-none');
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ sort: newSort }),
        success: function (data) {
          if (data.success) {
            $(`.sort-text[data-id="${id}"]`).removeClass('d-none').text(newSort);
          }
        }
      })
    });
    $('.status-toggle').on('click', function () {
      const $this = $(this);
      const id = $this.data('id');
      const currentStatus = $this.data('status');
      const newStatus = currentStatus == 1 ? 0 : 1;
      $.ajax({
        url: `/admin/articles/${id}`,
        type: 'PUT',
        headers: { 'accept': 'application/json' },
        contentType: 'application/json',
        data: JSON.stringify({ status: newStatus }),
        success: function (data) {
          if (data.success) {
            $this.data('status', newStatus);
            $this.html(` <i class="bi ${newStatus ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${newStatus ? 'text-success' : 'text-danger'}"></i>`);
          }
        }
      })
    });
  });
</script>
12.网站设置
npm install mongoose @nestjs/mongoose
12.1. dashboard.controller.ts
src/admin/controllers/dashboard.controller.ts

import { Controller, Get, Render } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
+@Controller('admin')
@ApiTags('dashboard')
export class DashboardController {
+   @Get('dashboard')
    @Render('dashboard')
    dashboard() {
        return { title: 'dashboard' };
    }
}

12.2. setting.dto.ts
src/shared/dto/setting.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSettingDto {
    @ApiProperty({ description: '网站名称', example: '我的网站' })
    siteName: string;

    @ApiProperty({ description: '网站描述', example: '这是我的个人网站' })
    siteDescription: string;

    @ApiProperty({ description: '联系邮箱', example: 'contact@example.com' })
    contactEmail: string;
}

export class UpdateSettingDto extends PartialType(CreateSettingDto) {
    id: string
}

12.3. setting.schema.ts
src/shared/schemas/setting.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type SettingDocument = HydratedDocument<Setting>;
@Schema()
export class Setting {
    id: string;
    @Prop({ required: true })
    siteName: string;
    @Prop()
    siteDescription: string;
    @Prop()
    contactEmail: string;
}
export const SettingSchema = SchemaFactory.createForClass(Setting);
SettingSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
SettingSchema.set('toJSON', { virtuals: true });
SettingSchema.set('toObject', { virtuals: true });

12.4. setting.service.ts
src/shared/services/setting.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingDocument } from '../schemas/setting.schema';
import { CreateSettingDto, UpdateSettingDto } from '../dto/setting.dto';
import { MongoDBBaseService } from './mongodb-base.service';

@Injectable()
export class SettingService extends MongoDBBaseService<SettingDocument, CreateSettingDto, UpdateSettingDto> {
    constructor(@InjectModel('Setting') settingModel: Model<SettingDocument>) {
        super(settingModel);
    }
    async findFirst(): Promise<SettingDocument> {
        return this.model.findOne().exec();
    }
}

12.5. mongodb-base.service.ts
src/shared/services/mongodb-base.service.ts

import { Model } from 'mongoose';
export abstract class MongoDBBaseService<T, C, U> {
    constructor(
        protected readonly model: Model<T>,
    ) { }

    async findAll() {
        return await this.model.find();
    }

    async findOne(id: string) {
        return await this.model.findById(id);
    }

    async create(createDto: C) {
        const createdEntity = new this.model(createDto);
        await createdEntity.save();
        return createdEntity;
    }

    async update(id: string, updateDto: U) {
        await this.model.findByIdAndUpdate(id, updateDto, { new: true });
    }

    async delete(id: string) {
        await this.model.findByIdAndDelete(id);
    }
}

12.6. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { UserController } from './controllers/user.controller';
import { RoleController } from "./controllers/role.controller";
import { AccessController } from "./controllers/access.controller";
+import { TagController } from "./controllers/tag.controller";
+import { ArticleController } from "./controllers/article.controller";
+import { CategoryController } from "./controllers/category.controller";
+import { UploadController } from './controllers/upload.controller';
+import { SettingController } from './controllers/setting.controller';
+@Module({
+   controllers: [DashboardController, UserController, RoleController, AccessController, TagController, ArticleController, CategoryController, UploadController, SettingController]
+})
+export class AdminModule {
+}
+
12.7. settings.hbs
views/settings.hbs

<form action="/admin/settings" method="post">
    <input type="hidden" name="id" value="{{settings.id}}">
    <div class="mb-3">
        <label for="siteName" class="form-label">网站名称</label>
        <input type="text" class="form-control" id="siteName" name="siteName" value="{{settings.siteName}}" required>
    </div>
    <div class="mb-3">
        <label for="siteDescription" class="form-label">网站描述</label>
        <input type="text" class="form-control" id="siteDescription" name="siteDescription"
            value="{{settings.siteDescription}}" required>
    </div>
    <div class="mb-3">
        <label for="contactEmail" class="form-label">联系邮箱</label>
        <input type="email" class="form-control" id="contactEmail" name="contactEmail" value="{{settings.contactEmail}}"
            required>
    </div>
    <button type="submit" class="btn btn-primary">保存设置</button>
</form>
12.8. setting.controller.ts
src/admin/controllers/setting.controller.ts

import { Controller, Get, Post, Body, Render, Redirect } from '@nestjs/common';
import { SettingService } from 'src/shared/services/setting.service';
import { UpdateSettingDto } from 'src/shared/dto/setting.dto';

@Controller('admin/settings')
export class SettingController {
    constructor(private readonly settingService: SettingService) { }

    @Get()
    @Render('settings')
    async getSettings() {
        let settings = await this.settingService.findFirst();
        if (!settings) {
            settings = await this.settingService.create({
                siteName: '默认网站名称',
                siteDescription: '默认网站描述',
                contactEmail: 'default@example.com',
            });
        }
        return { settings };
    }

    @Post()
    @Redirect('/admin/dashboard')
    async updateSettings(@Body() updateSettingDto: UpdateSettingDto) {
        await this.settingService.update(updateSettingDto.id, updateSettingDto);
        return { success: true };
    }
}

12.9. configuration.service.ts
src/shared/services/configuration.service.ts

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class ConfigurationService {
    constructor(private configService: ConfigService) { }
    get mysqlHost(): string {
        return this.configService.get<string>('MYSQL_HOST');
    }
    get mysqlPort(): number {
        return this.configService.get<number>('MYSQL_PORT');
    }
    get mysqlDB(): string {
        return this.configService.get<string>('MYSQL_DB');
    }
    get mysqlUser(): string {
        return this.configService.get<string>('MYSQL_USER');
    }
    get mysqlPassword(): string {
        return this.configService.get<string>('MYSQL_PASSWORD');
    }
    get mysqlConfig() {
        return {
            host: this.mysqlHost,
            port: this.mysqlPort,
            database: this.mysqlDB,
            username: this.mysqlUser,
            password: this.mysqlPassword
        }
    }
+   get mongodbHost(): string {
+       return this.configService.get<string>('MONGO_HOST');
+   }
+   get mongodbPort(): number {
+       return this.configService.get<number>('MONGO_PORT');
+   }
+   get mongodbDB(): string {
+       return this.configService.get<string>('MONGO_DB');
+   }
+   get mongodbUser(): string {
+       return this.configService.get<string>('MONGO_USER');
+   }
+   get mongodbPassword(): string {
+       return this.configService.get<string>('MONGO_PASSWORD');
+   }
+   get mongodbConfig() {
+       return {
+           uri: `mongodb://${this.mongodbHost}:${this.mongodbPort}/${this.mongodbDB}`
+       }
+   }
}
12.10. sidebar.hbs
views/partials/sidebar.hbs

<div class="col-md-3 col-lg-2 p-0">
+   <div class="accordion" id="sidebarMenu">
        <div class="accordion-item">
            <h2 class="accordion-header" id="heading">
+               <button class="accordion-button" type="button" data-bs-toggle="collapse"
+                   data-bs-target="#collapse1">权限管理</button>
            </h2>
            <div class="accordion-collapse collapse" id="collapse1">
                <div class="accordion-body">
                    <ul class="list-group">
                        <li class="list-group-item">
                            <a href="/admin/users">用户管理</a>
                        </li>
                        <li class="list-group-item">
                            <a href="/admin/roles">角色管理</a>
                        </li>
                        <li class="list-group-item">
                            <a href="/admin/accesses">资源管理</a>
                        </li>
                    </ul>
                </div>
            </div>
+           <h2 class="accordion-header" id="heading">
+               <button class="accordion-button" type="button" data-bs-toggle="collapse"
+                   data-bs-target="#collapse1">内容管理</button>
            </h2>
            <div class="accordion-collapse collapse" id="collapse1">
                <div class="accordion-body">
                    <ul class="list-group">
                        <li class="list-group-item">
                            <a href="/admin/tags">标签管理</a>
                        </li>
                        <li class="list-group-item">
                            <a href="/admin/categories">分类管理</a>
                        </li>
                        <li class="list-group-item">
                            <a href="/admin/articles">文章管理</a>
                        </li>
                    </ul>
                </div>
            </div>
+           <h2 class="accordion-header" id="heading">
+               <button class="accordion-button" type="button" data-bs-toggle="collapse"
+                   data-bs-target="#collapse1">设置</button>
+           </h2>
+           <div class="accordion-collapse collapse" id="collapse1">
+               <div class="accordion-body">
+                   <ul class="list-group">
+                       <li class="list-group-item">
+                           <a href="/admin/settings">网站设置</a>
+                       </li>
+                   </ul>
+               </div>
+           </div>
        </div>
+   </div>
</div>
12.11. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { WordExportService } from './services/word-export.service';
import { PptExportService } from './services/ppt-export.service';
import { ExcelExportService } from './services/excel-export.service';
+import { MongooseModule } from '@nestjs/mongoose';
+import { Setting, SettingSchema } from './schemas/setting.schema';
+import { SettingService } from './services/setting.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
+       MongooseModule.forRootAsync({
+           inject: [ConfigurationService],
+           useFactory: (configurationService: ConfigurationService) => ({
+               uri: configurationService.mongodbConfig.uri
+           }),
+       }),
+       MongooseModule.forFeature([
+           { name: Setting.name, schema: SettingSchema },
+       ]),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

13. 快捷操作
13.1. header.hbs
views/partials/header.hbs

<nav class="navbar navbar-expand-lg bg-light">
    <div class="container-fluid">
+       <a class="navbar-brand" href="/admin/dashboard">CMS</a>
        <div class="collapse navbar-collapse">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">欢迎, admin</a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item">退出登录</a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
13.2. main.hbs
views/layouts/main.hbs

<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CMS</title>
  <link href="/style/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/style/ckeditor5.css" />
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
+ <script src="/js/echarts.min.js"></script>
</head>

<body>
  {{> header }}
  <div class="container-fluid">
    <div class="row">
      {{> sidebar}}
      <div class="col-md-9 col-lg-10">
        <div class="container mt-4">
          {{{body}}}
        </div>
      </div>
    </div>
  </div>
  <script src="/js/bootstrap.bundle.min.js"></script>
</body>

</html>
13.3. dashboard.hbs
views/dashboard.hbs

<!-- 快捷操作栏 -->
<div class="row mb-4">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between">
+               <span>快捷操作</span>
+           </div>
+           <div class="card-body">
+               <div class="row text-center">
+                   <!-- 快捷操作按钮 -->
+                   <div class="col-md-2">
+                       <a href="/admin/articles" class="btn btn-outline-primary btn-block">
+                           <i class="bi bi-file-text"></i> 文章管理
+                       </a>
+                   </div>
+                   <div class="col-md-2">
+                       <a href="/admin/categories/create" class="btn btn-outline-success btn-block">
+                           <i class="bi bi-folder-plus"></i> 新增分类
+                       </a>
+                   </div>
+                   <div class="col-md-2">
+                       <a href="/admin/tags/create" class="btn btn-outline-info btn-block">
+                           <i class="bi bi-tag"></i> 新增标签
+                       </a>
+                   </div>
+                   <div class="col-md-2">
+                       <a href="/admin/users/create" class="btn btn-outline-warning btn-block">
+                           <i class="bi bi-person-plus"></i> 添加用户
+                       </a>
+                   </div>
+                   <div class="col-md-2">
+                       <a href="/admin/accesses/create" class="btn btn-outline-danger btn-block">
+                           <i class="bi bi-folder-plus"></i> 添加资源
+                       </a>
+                   </div>
+                   <div class="col-md-2">
+                       <a href="/admin/settings" class="btn btn-outline-secondary btn-block">
+                           <i class="bi bi-gear"></i> 系统设置
+                       </a>
+                   </div>
+               </div>
+           </div>
+       </div>
+   </div>
+</div>
14.系统概览
14.1. dashboard.controller.ts
src/admin/controllers/dashboard.controller.ts

import { Controller, Get, Render } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
+import { DashboardService } from 'src/shared/services/dashboard.service';
@Controller('admin')
@ApiTags('dashboard')
export class DashboardController {
+   constructor(
+       private readonly dashboardService: DashboardService
+   ) { }
    @Get('dashboard')
    @Render('dashboard')
+   async dashboard() {
+       return await this.dashboardService.getDashboardData();
    }
}

14.2. mysql-base.service.ts
src/shared/services/mysql-base.service.ts

import { Injectable } from "@nestjs/common";;
import { Repository, FindOneOptions } from 'typeorm';
import { DeepPartial } from 'typeorm/common/DeepPartial'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
@Injectable()
+export abstract class MySQLBaseService<T> {
+ constructor(protected repository: Repository<T>) { }
+ async findAll() {
+   return this.repository.find();
+ }
+ async findOne(options: FindOneOptions<T>) {
+   return this.repository.findOne(options);
+ }
+ async create(createDto: DeepPartial<T>) {
+   const entity = this.repository.create(createDto);
+   return await this.repository.save(entity);
+ }
+ async update(id: number, updateDto: QueryDeepPartialEntity<T>) {
+   return this.repository.update(id, updateDto);
+ }
+ async delete(id: number) {
+   return this.repository.delete(id);
+ }
+ async count(): Promise<number> {
+   return this.repository.count();
+ }
+}
+
14.3. dashboard.service.ts
src/shared/services/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { ArticleService } from './article.service';
import { CategoryService } from './category.service';
import { TagService } from './tag.service';

@Injectable()
export class DashboardService {
    constructor(
        private readonly userService: UserService,
        private readonly articleService: ArticleService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService
    ) { }

    async getDashboardData() {
        const [
            userCount,
            articleCount,
            categoryCount,
            tagCount
        ] = await Promise.all([
            this.userService.count(),
            this.articleService.count(),
            this.categoryService.count(),
            this.tagService.count()
        ]);
        return {
            userCount,
            articleCount,
            categoryCount,
            tagCount
        };
    }
}

14.4. dashboard.hbs
views/dashboard.hbs

<!-- 快捷操作栏 -->
<div class="row mb-4">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between">
                <span>快捷操作</span>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <!-- 快捷操作按钮 -->
                    <div class="col-md-2">
                        <a href="/admin/articles" class="btn btn-outline-primary btn-block">
                            <i class="bi bi-file-text"></i> 文章管理
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/categories/create" class="btn btn-outline-success btn-block">
                            <i class="bi bi-folder-plus"></i> 新增分类
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/tags/create" class="btn btn-outline-info btn-block">
                            <i class="bi bi-tag"></i> 新增标签
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/users/create" class="btn btn-outline-warning btn-block">
                            <i class="bi bi-person-plus"></i> 添加用户
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/accesses/create" class="btn btn-outline-danger btn-block">
                            <i class="bi bi-folder-plus"></i> 添加资源
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/settings" class="btn btn-outline-secondary btn-block">
                            <i class="bi bi-gear"></i> 系统设置
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
+</div>
+
+<!-- 系统概览 -->
+<div class="row mb-4">
+   <div class="col-md-3">
+       <div class="card text-white bg-primary">
+           <div class="card-body">
+               <h5 class="card-title">用户总数</h5>
+               <p class="card-text">{{userCount}}</p>
+           </div>
+       </div>
+   </div>
+   <div class="col-md-3">
+       <div class="card text-white bg-success">
+           <div class="card-body">
+               <h5 class="card-title">文章总数</h5>
+               <p class="card-text">{{articleCount}}</p>
+           </div>
+       </div>
+   </div>
+   <div class="col-md-3">
+       <div class="card text-white bg-info">
+           <div class="card-body">
+               <h5 class="card-title">分类总数</h5>
+               <p class="card-text">{{categoryCount}}</p>
+           </div>
+       </div>
+   </div>
+   <div class="col-md-3">
+       <div class="card text-white bg-warning">
+           <div class="card-body">
+               <h5 class="card-title">标签总数</h5>
+               <p class="card-text">{{tagCount}}</p>
+           </div>
+       </div>
+   </div>
</div>
14.5. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { WordExportService } from './services/word-export.service';
import { PptExportService } from './services/ppt-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { SettingService } from './services/setting.service';
+import { DashboardService } from './services/dashboard.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                uri: configurationService.mongodbConfig.uri
            }),
        }),
        MongooseModule.forFeature([
            { name: Setting.name, schema: SettingSchema },
        ]),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

15.最新数据
15.1. fromNow.ts
src/shared/helpers/fromNow.ts

import * as dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import * as relativeTime from 'dayjs/plugin/relativeTime'
dayjs.locale('zh-cn')
dayjs.extend(relativeTime);
export function fromNow(date: string): string {
    return dayjs(date).fromNow();
}
15.2. index.ts
src/shared/helpers/index.ts

export * from './eq';
export * from './range';
export * from './inc';
export * from './dec';
export * from './multiply';
+export * from './json';
+export * from './def';
+export * from './mapToIds';
+export * from './contains';
+export * from './fromNow';
15.3. mysql-base.service.ts
src/shared/services/mysql-base.service.ts

import { Injectable } from "@nestjs/common";;
import { Repository, FindOneOptions } from 'typeorm';
import { DeepPartial } from 'typeorm/common/DeepPartial'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
@Injectable()
export abstract class MySQLBaseService<T> {
  constructor(protected repository: Repository<T>) { }
  async findAll() {
    return this.repository.find();
  }
  async findOne(options: FindOneOptions<T>) {
    return this.repository.findOne(options);
  }
  async create(createDto: DeepPartial<T>) {
    const entity = this.repository.create(createDto);
    return await this.repository.save(entity);
  }
  async update(id: number, updateDto: QueryDeepPartialEntity<T>) {
    return this.repository.update(id, updateDto);
  }
  async delete(id: number) {
    return this.repository.delete(id);
  }
  async count(): Promise<number> {
    return this.repository.count();
  }
+ async findLatest(limit: number) {
+   const order: any = {
+     id: 'DESC'
+   }
+   return this.repository.find({
+     order,
+     take: limit
+   });
+ }
}

15.4. dashboard.service.ts
src/shared/services/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { ArticleService } from './article.service';
import { CategoryService } from './category.service';
import { TagService } from './tag.service';

@Injectable()
export class DashboardService {
    constructor(
        private readonly userService: UserService,
        private readonly articleService: ArticleService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService
    ) { }

    async getDashboardData() {
        const [
            userCount,
            articleCount,
            categoryCount,
+           tagCount,
+           latestArticles,
+           latestUsers,
        ] = await Promise.all([
            this.userService.count(),
            this.articleService.count(),
            this.categoryService.count(),
+           this.tagService.count(),
+           this.articleService.findLatest(5),
+           this.userService.findLatest(5),
        ]);
        return {
            userCount,
            articleCount,
            categoryCount,
+           tagCount,
+           latestArticles,
+           latestUsers
        };
    }
}

15.5. dashboard.hbs
views/dashboard.hbs

<!-- 快捷操作栏 -->
<div class="row mb-4">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between">
                <span>快捷操作</span>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <!-- 快捷操作按钮 -->
                    <div class="col-md-2">
                        <a href="/admin/articles" class="btn btn-outline-primary btn-block">
                            <i class="bi bi-file-text"></i> 文章管理
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/categories/create" class="btn btn-outline-success btn-block">
                            <i class="bi bi-folder-plus"></i> 新增分类
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/tags/create" class="btn btn-outline-info btn-block">
                            <i class="bi bi-tag"></i> 新增标签
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/users/create" class="btn btn-outline-warning btn-block">
                            <i class="bi bi-person-plus"></i> 添加用户
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/accesses/create" class="btn btn-outline-danger btn-block">
                            <i class="bi bi-folder-plus"></i> 添加资源
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/settings" class="btn btn-outline-secondary btn-block">
                            <i class="bi bi-gear"></i> 系统设置
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 系统概览 -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card text-white bg-primary">
            <div class="card-body">
                <h5 class="card-title">用户总数</h5>
                <p class="card-text">{{userCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-success">
            <div class="card-body">
                <h5 class="card-title">文章总数</h5>
                <p class="card-text">{{articleCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-info">
            <div class="card-body">
                <h5 class="card-title">分类总数</h5>
                <p class="card-text">{{categoryCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-warning">
            <div class="card-body">
                <h5 class="card-title">标签总数</h5>
                <p class="card-text">{{tagCount}}</p>
            </div>
        </div>
    </div>
+</div>
+<div class="row mb-4">
+   <div class="col-md-6">
+       <div class="card">
+           <div class="card-header">最新文章</div>
+           <ul class="list-group list-group-flush">
+               {{#each latestArticles}}
+               <li class="list-group-item">
+                   <a href="/admin/articles/{{id}}">{{title}}</a>
+                   <span class="float-right">{{fromNow createdAt}}</span>
+               </li>
+               {{/each}}
+           </ul>
+       </div>
+   </div>
+   <div class="col-md-6">
+       <div class="card">
+           <div class="card-header">最新用户</div>
+           <ul class="list-group list-group-flush">
+               {{#each latestUsers}}
+               <li class="list-group-item">
+                   <a href="/admin/users/{{id}}">{{username}}</a>
+                   <span class="float-right">{{fromNow createdAt}}</span>
+               </li>
+               {{/each}}
+           </ul>
+       </div>
+   </div>
</div>
16.内容统计图表
16.1. dashboard.service.ts
src/shared/services/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { ArticleService } from './article.service';
import { CategoryService } from './category.service';
import { TagService } from './tag.service';

@Injectable()
export class DashboardService {
    constructor(
        private readonly userService: UserService,
        private readonly articleService: ArticleService,
        private readonly categoryService: CategoryService,
        private readonly tagService: TagService
    ) { }

    async getDashboardData() {
        const [
            userCount,
            articleCount,
            categoryCount,
            tagCount,
            latestArticles,
            latestUsers,
+           articleTrend,
+           userGrowth,
        ] = await Promise.all([
            this.userService.count(),
            this.articleService.count(),
            this.categoryService.count(),
            this.tagService.count(),
            this.articleService.findLatest(5),
            this.userService.findLatest(5),
+           this.articleService.getTrend('article'),
+           this.userService.getTrend('user'),
        ]);
        return {
            userCount,
            articleCount,
            categoryCount,
            tagCount,
            latestArticles,
+           latestUsers,
+           articleTrend,
+           userGrowth
        };
    }
}

16.2. mysql-base.service.ts
src/shared/services/mysql-base.service.ts

import { Injectable } from "@nestjs/common";;
import { Repository, FindOneOptions } from 'typeorm';
import { DeepPartial } from 'typeorm/common/DeepPartial'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
@Injectable()
export abstract class MySQLBaseService<T> {
  constructor(protected repository: Repository<T>) { }
  async findAll() {
    return this.repository.find();
  }
  async findOne(options: FindOneOptions<T>) {
    return this.repository.findOne(options);
  }
  async create(createDto: DeepPartial<T>) {
    const entity = this.repository.create(createDto);
    return await this.repository.save(entity);
  }
  async update(id: number, updateDto: QueryDeepPartialEntity<T>) {
    return this.repository.update(id, updateDto);
  }
  async delete(id: number) {
    return this.repository.delete(id);
  }
  async count(): Promise<number> {
    return this.repository.count();
  }
  async findLatest(limit: number) {
    const order: any = {
      id: 'DESC'
    }
    return this.repository.find({
      order,
      take: limit
    });
  }
+ async getTrend(tableName): Promise<{ dates: string[]; counts: number[] }> {
+   const result = await this.repository.query(`
+           SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') as date, COUNT(*) as count
+           FROM ${tableName}
+           GROUP BY date
+           ORDER BY date ASC
+       `);
+   const dates = result.map(row => row.date);
+   const counts = result.map(row => row.count);
+   return { dates, counts };
+ }
}

16.3. article.service.ts
src/shared/services/article.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Article } from "../entities/article.entity";
import { Repository, Like, In, UpdateResult } from 'typeorm';
import { MySQLBaseService } from "./mysql-base.service";
+import { CreateArticleDto, UpdateArticleDto } from "../dto/article.dto";
+import { Category } from "../entities/category.entity";
+import { Tag } from "../entities/tag.entity";
+@Injectable()
+export class ArticleService extends MySQLBaseService<Article> {
+ constructor(
+   @InjectRepository(Article) protected repository: Repository<Article>,
+   @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
+   @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>
+ ) {
+   super(repository);
+ }
+ async findAll(keyword?: string) {
+   const where = keyword ? [
+     { title: Like(`%${keyword}%`) }
+   ] : {};
+   return this.repository.find({ where, relations: ['categories', 'tags'] });
+ }
+ async findAllWithPagination(page: number, limit: number, keyword?: string) {
+   const where = keyword ? [
+     { title: Like(`%${keyword}%`) }
+   ] : {};
+   const [articles, total] = await this.repository.findAndCount({
+     where,
+     relations: ['categories', 'tags'],
+     skip: (page - 1) * limit,
+     take: limit
+   });
+   return { articles, total };
+ }
+ async create(createArticleDto: CreateArticleDto) {
+   const { categoryIds = [], tagIds = [], ...articleData } = createArticleDto;
+   const article = this.repository.create(articleData);
+   article.categories = await this.categoryRepository.findBy({ id: In(categoryIds) });
+   article.tags = await this.tagRepository.findBy({ id: In(tagIds) });
+   return await this.repository.save(article);
+ }
+ async update(id: number, updateArticleDto: UpdateArticleDto) {
+   const { categoryIds, tagIds, ...articleData } = updateArticleDto;
+   const article = await this.repository.findOne({ where: { id }, relations: ['categories', 'tags'] });
+   if (!article) throw new NotFoundException('Article not found');
+   Object.assign(article, articleData);
+   if (categoryIds) {
+     article.categories = await this.categoryRepository.findBy({ id: In(categoryIds) });
+   }
+   if (tagIds) {
+     article.tags = await this.tagRepository.findBy({ id: In(tagIds) });
+   }
+   await this.repository.save(article);
+   return UpdateResult.from({ raw: [], affected: 1, records: [] });
+ }
+}
+
16.4. dashboard.hbs
views/dashboard.hbs

<!-- 快捷操作栏 -->
<div class="row mb-4">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between">
                <span>快捷操作</span>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <!-- 快捷操作按钮 -->
                    <div class="col-md-2">
                        <a href="/admin/articles" class="btn btn-outline-primary btn-block">
                            <i class="bi bi-file-text"></i> 文章管理
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/categories/create" class="btn btn-outline-success btn-block">
                            <i class="bi bi-folder-plus"></i> 新增分类
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/tags/create" class="btn btn-outline-info btn-block">
                            <i class="bi bi-tag"></i> 新增标签
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/users/create" class="btn btn-outline-warning btn-block">
                            <i class="bi bi-person-plus"></i> 添加用户
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/accesses/create" class="btn btn-outline-danger btn-block">
                            <i class="bi bi-folder-plus"></i> 添加资源
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/settings" class="btn btn-outline-secondary btn-block">
                            <i class="bi bi-gear"></i> 系统设置
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 系统概览 -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card text-white bg-primary">
            <div class="card-body">
                <h5 class="card-title">用户总数</h5>
                <p class="card-text">{{userCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-success">
            <div class="card-body">
                <h5 class="card-title">文章总数</h5>
                <p class="card-text">{{articleCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-info">
            <div class="card-body">
                <h5 class="card-title">分类总数</h5>
                <p class="card-text">{{categoryCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-warning">
            <div class="card-body">
                <h5 class="card-title">标签总数</h5>
                <p class="card-text">{{tagCount}}</p>
            </div>
        </div>
    </div>
</div>
<div class="row mb-4">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">最新文章</div>
            <ul class="list-group list-group-flush">
                {{#each latestArticles}}
                <li class="list-group-item">
                    <a href="/admin/articles/{{id}}">{{title}}</a>
                    <span class="float-right">{{fromNow createdAt}}</span>
                </li>
                {{/each}}
            </ul>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">最新用户</div>
            <ul class="list-group list-group-flush">
                {{#each latestUsers}}
                <li class="list-group-item">
                    <a href="/admin/users/{{id}}">{{username}}</a>
                    <span class="float-right">{{fromNow createdAt}}</span>
                </li>
                {{/each}}
            </ul>
        </div>
    </div>
</div>

+<!-- 内容统计图表 -->
+<div class="row mb-4">
+   <!-- 左侧的图表容器，用于显示文章发布趋势图表 -->
+   <div class="col-md-6">
+       <!-- 文章发布趋势图表的容器，宽度为100%，高度为400像素 -->
+       <div id="articleTrendChart" style="width: 100%;height:400px;"></div>
+   </div>
+   <!-- 右侧的图表容器，用于显示用户增长趋势图表 -->
+   <div class="col-md-6">
+       <!-- 用户增长趋势图表的容器，宽度为100%，高度为400像素 -->
+       <div id="userGrowthChart" style="width: 100%;height:400px;"></div>
+   </div>
+</div>
+<script type="text/javascript">
+   // 初始化文章发布趋势图表
+   var articleTrendChart = echarts.init(document.getElementById('articleTrendChart'));
+   // 配置文章发布趋势图表的选项
+   var articleTrendOption = {
+       title: {
+           text: '文章发布趋势' // 图表标题
+       },
+       tooltip: {}, // 工具提示
+       xAxis: {
+           type: 'category', // X轴类型为类目型
+           data: {{{ json articleTrend.dates }}} // X轴数据，使用模板引擎生成的日期数组
+       },
+       yAxis: {
+           type: 'value' // Y轴类型为数值型
+       },
+       series: [{
+           data: {{{ json articleTrend.counts }}}, // 图表数据，使用模板引擎生成的文章发布数量数组
+           type: 'line' // 数据系列的图表类型为折线图
+       }]
+   };
+   // 将配置的选项应用到文章发布趋势图表上
+   articleTrendChart.setOption(articleTrendOption);
+   
+   // 初始化用户增长趋势图表
+   var userGrowthChart = echarts.init(document.getElementById('userGrowthChart'));
+   // 配置用户增长趋势图表的选项
+   var userGrowthOption = {
+       title: {
+           text: '用户增长趋势' // 图表标题
+       },
+       tooltip: {}, // 工具提示
+       xAxis: {
+           type: 'category', // X轴类型为类目型
+           data: {{{ json userGrowth.dates }}} // X轴数据，使用模板引擎生成的日期数组
+       },
+       yAxis: {
+           type: 'value' // Y轴类型为数值型
+       },
+       series: [{
+           data: {{{ json userGrowth.counts }}}, // 图表数据，使用模板引擎生成的用户增长数量数组
+           type: 'bar' // 数据系列的图表类型为柱状图
+       }]
+   };
+   // 将配置的选项应用到用户增长趋势图表上
+   userGrowthChart.setOption(userGrowthOption);
+</script>

17.天气预报
npm i axios geoip-lite
17.1. dashboard.controller.ts
src/admin/controllers/dashboard.controller.ts

import { Controller, Get, Render } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from 'src/shared/services/dashboard.service';
+import { WeatherService } from 'src/shared/services/weather.service';
@Controller('admin')
@ApiTags('dashboard')
export class DashboardController {
    constructor(
+       private readonly dashboardService: DashboardService,
+       private readonly weatherService: WeatherService,
    ) { }
    @Get('dashboard')
    @Render('dashboard')
    async dashboard() {
        return await this.dashboardService.getDashboardData();
    }
+
+   @Get('dashboard/weather')
+   async getWeather() {
+       const weather = await this.weatherService.getWeather();
+       return { weather };
+   }
}

17.2. weather.service.ts
src/shared/services/weather.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as geoip from 'geoip-lite';

@Injectable()
export class WeatherService {
    constructor(private readonly configService: ConfigService) { }

    async getExternalIP() {
        try {
            const ipApiUrl = this.configService.get<string>('IP_API_URL');
            const response = await axios.get(ipApiUrl);
            return response.data.ip;
        } catch (error) {
            console.error('Error fetching external IP:', error);
            return 'N/A';
        }
    }

    async getWeather() {
        const ip = await this.getExternalIP();
        const geo = geoip.lookup(ip);
        const location = geo ? `${geo.city}, ${geo.country}` : 'Unknown';
        let weather = '无法获取天气信息';
        try {
            if (geo) {
                const apiKey = this.configService.get<string>('WEATHER_API_KEY');
                const weatherApiUrl = this.configService.get<string>('WEATHER_API_URL');
                const response = await axios.get(`${weatherApiUrl}?lang=zh&key=${apiKey}&q=${location}`);
                weather = `${response.data.current.temp_c}°C, ${response.data.current.condition.text}`;
            }
        } catch (error) {
            console.error('获取天气信息失败:', error.message);
        }
        return weather;
    }
}

17.3. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { WordExportService } from './services/word-export.service';
import { PptExportService } from './services/ppt-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { SettingService } from './services/setting.service';
import { DashboardService } from './services/dashboard.service';
+import { WeatherService } from "./services/weather.service";
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService, WeatherService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService, WeatherService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                uri: configurationService.mongodbConfig.uri
            }),
        }),
        MongooseModule.forFeature([
            { name: Setting.name, schema: SettingSchema },
        ]),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

17.4. dashboard.hbs
views/dashboard.hbs

<!-- 快捷操作栏 -->
<div class="row mb-4">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between">
                <span>快捷操作</span>
+               <span id="weather-info">正在获取天气信息...</span>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <!-- 快捷操作按钮 -->
                    <div class="col-md-2">
                        <a href="/admin/articles" class="btn btn-outline-primary btn-block">
                            <i class="bi bi-file-text"></i> 文章管理
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/categories/create" class="btn btn-outline-success btn-block">
                            <i class="bi bi-folder-plus"></i> 新增分类
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/tags/create" class="btn btn-outline-info btn-block">
                            <i class="bi bi-tag"></i> 新增标签
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/users/create" class="btn btn-outline-warning btn-block">
                            <i class="bi bi-person-plus"></i> 添加用户
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/accesses/create" class="btn btn-outline-danger btn-block">
                            <i class="bi bi-folder-plus"></i> 添加资源
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/settings" class="btn btn-outline-secondary btn-block">
                            <i class="bi bi-gear"></i> 系统设置
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 系统概览 -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card text-white bg-primary">
            <div class="card-body">
                <h5 class="card-title">用户总数</h5>
                <p class="card-text">{{userCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-success">
            <div class="card-body">
                <h5 class="card-title">文章总数</h5>
                <p class="card-text">{{articleCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-info">
            <div class="card-body">
                <h5 class="card-title">分类总数</h5>
                <p class="card-text">{{categoryCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-warning">
            <div class="card-body">
                <h5 class="card-title">标签总数</h5>
                <p class="card-text">{{tagCount}}</p>
            </div>
        </div>
    </div>
</div>
<div class="row mb-4">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">最新文章</div>
            <ul class="list-group list-group-flush">
                {{#each latestArticles}}
                <li class="list-group-item">
                    <a href="/admin/articles/{{id}}">{{title}}</a>
                    <span class="float-right">{{fromNow createdAt}}</span>
                </li>
                {{/each}}
            </ul>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">最新用户</div>
            <ul class="list-group list-group-flush">
                {{#each latestUsers}}
                <li class="list-group-item">
                    <a href="/admin/users/{{id}}">{{username}}</a>
                    <span class="float-right">{{fromNow createdAt}}</span>
                </li>
                {{/each}}
            </ul>
        </div>
    </div>
</div>

<!-- 内容统计图表 -->
<div class="row mb-4">
    <div class="col-md-6">
        <div id="articleTrendChart" style="width: 100%;height:400px;"></div>
    </div>
    <div class="col-md-6">
        <div id="userGrowthChart" style="width: 100%;height:400px;"></div>
    </div>
</div>
<script type="text/javascript">
    var articleTrendChart = echarts.init(document.getElementById('articleTrendChart'));
    var articleTrendOption = {
        title: {
            text: '文章发布趋势'
        },
        tooltip: {},
        xAxis: {
            type: 'category',
            data: {{{ json articleTrend.dates }}}
        },
    yAxis: {
        type: 'value'
    },
    series: [{
        data: {{{ json articleTrend.counts }}},
        type: 'line'
        }]
    };
    articleTrendChart.setOption(articleTrendOption);
    var userGrowthChart = echarts.init(document.getElementById('userGrowthChart'));
    var userGrowthOption = {
        title: {
            text: '用户增长趋势'
        },
        tooltip: {},
        xAxis: {
            type: 'category',
            data: {{{ json userGrowth.dates }}}
        },
    yAxis: {
        type: 'value'
    },
    series: [{
        data: {{{ json userGrowth.counts }}},
        type: 'bar'
        }]
    };
    userGrowthChart.setOption(userGrowthOption);
+</script>
+<script type="text/javascript">
+   $(function () {
+       $.ajax({
+           url: '/admin/dashboard/weather',
+           method: 'GET',
+           success: function (data) {
+               $('#weather-info').text(data.weather);
+           },
+           error: function () {
+               $('#weather-info').text('获取天气信息失败');
+           }
+       });
+   });
</script>
18.服务器状态
npm install systeminformation
18.1. main.hbs
views/layouts/main.hbs

<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CMS</title>
  <link href="/style/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/style/ckeditor5.css" />
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="/js/echarts.min.js"></script>
+ <script src="/js/handlebars.min.js"></script>
</head>

<body>
  {{> header }}
  <div class="container-fluid">
    <div class="row">
      {{> sidebar}}
      <div class="col-md-9 col-lg-10">
        <div class="container mt-4">
          {{{body}}}
        </div>
      </div>
    </div>
  </div>
  <script src="/js/bootstrap.bundle.min.js"></script>
</body>

</html>
18.2. dashboard.controller.ts
src/admin/controllers/dashboard.controller.ts

+import { Controller, Get, Render, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
+import { interval, mergeMap, map } from 'rxjs';
import { DashboardService } from 'src/shared/services/dashboard.service';
import { WeatherService } from 'src/shared/services/weather.service';
+import { SystemService } from 'src/shared/services/system.service';
@Controller('admin')
@ApiTags('dashboard')
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly weatherService: WeatherService,
+       private readonly systemService: SystemService
    ) { }
    @Get('dashboard')
    @Render('dashboard')
    async dashboard() {
        return await this.dashboardService.getDashboardData();
    }

    @Get('dashboard/weather')
    async getWeather() {
        const weather = await this.weatherService.getWeather();
        return { weather };
    }
+   @Sse('dashboard/systemInfo')
+   systemInfo() {
+       return interval(3000).pipe(
+           mergeMap(() => this.systemService.getSystemInfo()),
+           map((systemInfo) => ({ data: systemInfo }))
+       );
+   }
}

18.3. system.service.ts
src/shared/services/system.service.ts

// 导入 Injectable 装饰器，表示该类可以被依赖注入
import { Injectable } from '@nestjs/common';
// 导入 systeminformation 模块，用于获取系统信息
import * as si from 'systeminformation';

// 使用 Injectable 装饰器，将此类标记为可注入服务
@Injectable()
export class SystemService {
    // 私有方法，将字节值格式化为GB，保留两位小数
    private formatToGB(value: number) {
        return (value / (1024 ** 3)).toFixed(2);
    }

    // 异步方法，获取系统信息
    async getSystemInfo() {
        // 获取当前CPU负载信息
        const cpu = await si.currentLoad();
        // 获取内存使用情况
        const memory = await si.mem();
        // 获取磁盘使用情况
        const disk = await si.fsSize();
        // 获取操作系统信息
        const osInfo = await si.osInfo();
        // 获取网络接口信息
        const networkInterfaces = await si.networkInterfaces();

        // 返回格式化后的系统信息
        return {
            // CPU信息
            cpu: {
                // CPU核心数
                cores: cpu.cpus.length,
                // 用户进程占用的CPU负载百分比
                userLoad: cpu.currentLoadUser.toFixed(2),
                // 系统进程占用的CPU负载百分比
                systemLoad: cpu.currentLoadSystem.toFixed(2),
                // 空闲的CPU负载百分比
                idle: cpu.currentLoadIdle.toFixed(2),
            },
            // 内存信息
            memory: {
                // 总内存，单位GB
                total: this.formatToGB(memory.total),
                // 已使用内存，单位GB
                used: this.formatToGB(memory.used),
                // 空闲内存，单位GB
                free: this.formatToGB(memory.free),
                // 内存使用率，单位百分比
                usage: ((memory.used / memory.total) * 100).toFixed(2),
            },
            // 磁盘信息
            disks: disk.map(d => ({
                // 挂载点
                mount: d.mount,
                // 文件系统类型
                filesystem: d.fs,
                // 磁盘类型
                type: d.type,
                // 磁盘总大小，单位GB
                size: this.formatToGB(d.size),
                // 已使用空间，单位GB
                used: this.formatToGB(d.used),
                // 可用空间，单位GB
                available: this.formatToGB(d.available),
                // 磁盘使用率，单位百分比
                usage: d.use.toFixed(2),
            })),
            // 服务器信息
            server: {
                // 主机名
                hostname: osInfo.hostname,
                // IP地址，若无网络接口则返回 'N/A'
                ip: networkInterfaces[0]?.ip4 || 'N/A',
                // 操作系统发行版
                os: osInfo.distro,
                // 系统架构类型
                arch: osInfo.arch,
            }
        };
    }
}
18.4. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { WordExportService } from './services/word-export.service';
import { PptExportService } from './services/ppt-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { SettingService } from './services/setting.service';
import { DashboardService } from './services/dashboard.service';
import { WeatherService } from "./services/weather.service";
+import { SystemService } from './services/system.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService, WeatherService, SystemService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService, WeatherService, SystemService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                uri: configurationService.mongodbConfig.uri
            }),
        }),
        MongooseModule.forFeature([
            { name: Setting.name, schema: SettingSchema },
        ]),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

18.5. dashboard.hbs
views/dashboard.hbs

<!-- 快捷操作栏 -->
<div class="row mb-4">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header d-flex justify-content-between">
                <span>快捷操作</span>
                <span id="weather-info">正在获取天气信息...</span>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <!-- 快捷操作按钮 -->
                    <div class="col-md-2">
                        <a href="/admin/articles" class="btn btn-outline-primary btn-block">
                            <i class="bi bi-file-text"></i> 文章管理
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/categories/create" class="btn btn-outline-success btn-block">
                            <i class="bi bi-folder-plus"></i> 新增分类
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/tags/create" class="btn btn-outline-info btn-block">
                            <i class="bi bi-tag"></i> 新增标签
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/users/create" class="btn btn-outline-warning btn-block">
                            <i class="bi bi-person-plus"></i> 添加用户
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/accesses/create" class="btn btn-outline-danger btn-block">
                            <i class="bi bi-folder-plus"></i> 添加资源
                        </a>
                    </div>
                    <div class="col-md-2">
                        <a href="/admin/settings" class="btn btn-outline-secondary btn-block">
                            <i class="bi bi-gear"></i> 系统设置
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 系统概览 -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card text-white bg-primary">
            <div class="card-body">
                <h5 class="card-title">用户总数</h5>
                <p class="card-text">{{userCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-success">
            <div class="card-body">
                <h5 class="card-title">文章总数</h5>
                <p class="card-text">{{articleCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-info">
            <div class="card-body">
                <h5 class="card-title">分类总数</h5>
                <p class="card-text">{{categoryCount}}</p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card text-white bg-warning">
            <div class="card-body">
                <h5 class="card-title">标签总数</h5>
                <p class="card-text">{{tagCount}}</p>
            </div>
        </div>
    </div>
</div>
<div class="row mb-4">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">最新文章</div>
            <ul class="list-group list-group-flush">
                {{#each latestArticles}}
                <li class="list-group-item">
                    <a href="/admin/articles/{{id}}">{{title}}</a>
                    <span class="float-right">{{fromNow createdAt}}</span>
                </li>
                {{/each}}
            </ul>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">最新用户</div>
            <ul class="list-group list-group-flush">
                {{#each latestUsers}}
                <li class="list-group-item">
                    <a href="/admin/users/{{id}}">{{username}}</a>
                    <span class="float-right">{{fromNow createdAt}}</span>
                </li>
                {{/each}}
            </ul>
        </div>
    </div>
</div>

<!-- 内容统计图表 -->
<div class="row mb-4">
    <div class="col-md-6">
        <div id="articleTrendChart" style="width: 100%;height:400px;"></div>
    </div>
    <div class="col-md-6">
        <div id="userGrowthChart" style="width: 100%;height:400px;"></div>
    </div>
</div>
<script type="text/javascript">
    var articleTrendChart = echarts.init(document.getElementById('articleTrendChart'));
    var articleTrendOption = {
        title: {
            text: '文章发布趋势'
        },
        tooltip: {},
        xAxis: {
            type: 'category',
            data: {{{ json articleTrend.dates }}}
        },
    yAxis: {
        type: 'value'
    },
    series: [{
        data: {{{ json articleTrend.counts }}},
        type: 'line'
        }]
    };
    articleTrendChart.setOption(articleTrendOption);
    var userGrowthChart = echarts.init(document.getElementById('userGrowthChart'));
    var userGrowthOption = {
        title: {
            text: '用户增长趋势'
        },
        tooltip: {},
        xAxis: {
            type: 'category',
            data: {{{ json userGrowth.dates }}}
        },
    yAxis: {
        type: 'value'
    },
    series: [{
        data: {{{ json userGrowth.counts }}},
        type: 'bar'
        }]
    };
    userGrowthChart.setOption(userGrowthOption);
</script>
<script type="text/javascript">
    $(function () {
        $.ajax({
            url: '/admin/dashboard/weather',
            method: 'GET',
            success: function (data) {
                $('#weather-info').text(data.weather);
            },
            error: function () {
                $('#weather-info').text('获取天气信息失败');
            }
        });
    });
+</script>
+<!-- 系统状态整体展示 -->
+<div class="row mb-4">
+   <div class="col-md-12">
+       <div class="card">
+           <div class="card-header">系统状态</div>
+           <div class="card-body" id="system-status">
+               <div>正在获取系统状态数据...</div>
+           </div>
+       </div>
+   </div>
+</div>
+<script id="system-status-template" type="text/x-handlebars-template">
+   <div class="row">
+       <div class="col-md-4">
+           <h5>服务器信息</h5>
+           <table class="table table-striped">
+               <tr><th>主机名</th><td>\{{server.hostname}}</td></tr>
+               <tr><th>IP 地址</th><td>\{{server.ip}}</td></tr>
+               <tr><th>操作系统</th><td>\{{server.os}}</td></tr>
+               <tr><th>架构</th><td>\{{server.arch}}</td></tr>
+           </table>
+       </div>
+       <div class="col-md-4">
+           <h5>CPU 状态</h5>
+           <table class="table table-striped">
+               <tr><th>核心数</th><td>\{{cpu.cores}}</td></tr>
+               <tr><th>用户占用率</th><td>\{{cpu.userLoad}}%</td></tr>
+               <tr><th>系统占用率</th><td>\{{cpu.systemLoad}}%</td></tr>
+               <tr><th>空闲率</th><td>\{{cpu.idle}}%</td></tr>
+           </table>
+       </div>
+       <div class="col-md-4">
+           <h5>内存状态</h5>
+           <table class="table table-striped">
+               <tr><th>总内存</th><td>\{{memory.total}} GB</td></tr>
+               <tr><th>已用内存</th><td>\{{memory.used}} GB</td></tr>
+               <tr><th>剩余内存</th><td>\{{memory.free}} GB</td></tr>
+               <tr><th>使用率</th><td>\{{memory.usage}}%</td></tr>
+           </table>
+       </div>
+   </div>
+   <div class="row">
+       <div class="col-md-12">
+           <h5>磁盘状态</h5>
+           <table class="table table-striped">
+               <thead><tr><th>挂载点</th><th>总空间</th><th>已用</th><th>使用率</th></tr></thead>
+               <tbody>
+                   \{{#each disks}}
+                   <tr>
+                       <td>\{{this.mount}}</td>
+                       <td>\{{this.size}} GB</td>
+                       <td>\{{this.used}} GB</td>
+                       <td>\{{this.usage}}%</td>
+                   </tr>
+                   \{{/each}}
+               </tbody>
+           </table>
+       </div>
+   </div>
+</script>
+<script type="text/javascript">
+   $(function () {
+        // 创建一个新的 EventSource 实例，用于从 '/admin/dashboard/systemInfo' 端点接收服务器发送的事件
+       const eventSource = new EventSource('/admin/dashboard/systemInfo');
+       // 获取存储在 HTML 中的 Handlebars 模板内容
+       const source = $('#system-status-template').html();
+       // 使用 Handlebars 编译模板，将其转换为一个可以渲染数据的函数
+       const template = Handlebars.compile(source);
+       // 当接收到服务器发送的消息时触发该函数
+       eventSource.onmessage = function (event) {
+           // 将接收到的 JSON 数据字符串解析为 JavaScript 对象
+           const systemInfo = JSON.parse(event.data);
+           // 使用 Handlebars 模板将系统信息渲染为 HTML
+           const html = template(systemInfo);
+           // 将生成的 HTML 内容插入到页面中 ID 为 'system-status' 的元素中
+           $('#system-status').html(html);
+       };
+       // 当发生错误时触发该函数
+       eventSource.onerror = function () {
+           // 显示错误信息，表示无法获取系统状态数据
+           $('#system-status').html('<div>获取系统状态数据失败</div>');
+       };
+   });
</script>
19.后台登录和退出
npm install svg-captcha
19.1. utility.service.ts
src/shared/services/utility.service.ts

import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt'
+import * as svgCaptcha from 'svg-captcha';
@Injectable()
export class UtilityService {
    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return bcrypt.hash(password, salt);
    }
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash)
    }
+   generateCaptcha(options) {
+       return svgCaptcha.create(options);
+   }
}
19.2. header.hbs
views/partials/header.hbs

<nav class="navbar navbar-expand-lg bg-light">
    <div class="container-fluid">
        <a class="navbar-brand" href="/admin/dashboard">CMS</a>
        <div class="collapse navbar-collapse">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">欢迎, admin</a>
                    <ul class="dropdown-menu">
+                       <li><a class="dropdown-item" href="/admin/logout">退出登录</a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
19.3. admin.module.ts
src/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { UserController } from './controllers/user.controller';
import { RoleController } from "./controllers/role.controller";
import { AccessController } from "./controllers/access.controller";
import { TagController } from "./controllers/tag.controller";
import { ArticleController } from "./controllers/article.controller";
import { CategoryController } from "./controllers/category.controller";
import { UploadController } from './controllers/upload.controller';
import { SettingController } from './controllers/setting.controller';
+import { AuthController } from './controllers/auth.controller';
@Module({
+   controllers: [DashboardController, UserController, RoleController, AccessController, TagController, ArticleController, CategoryController, UploadController, SettingController, AuthController]
})
export class AdminModule {
}

19.4. login.hbs
views/auth/login.hbs

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理员登录</title>
    <link href="/style/bootstrap.min.css" rel="stylesheet" />
    <script src="/js/jquery.min.js"></script>
</head>

<body>
    <div class="container mt-5">
        <h1 class="text-center">管理员登录</h1>
        {{#if message}}
        <div class="alert alert-danger">{{message}}</div>
        {{/if}}
        <form action="/admin/login" method="POST" class="mt-4">
            <div class="mb-3">
                <label for="username" class="form-label">用户名</label>
                <input type="text" class="form-control" id="username" name="username" required>
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">密码</label>
                <input type="password" class="form-control" id="password" name="password" required>
            </div>
            <div class="mb-3">
                <label for="captcha" class="form-label">验证码</label>
                <div class="d-flex">
                    <input type="text" class="form-control me-2" id="captcha" name="captcha" required>
                    <img id="captcha-img" src="/admin/captcha" alt="captcha" onclick="reloadCaptcha()"
                        style="cursor:pointer;">
                </div>
            </div>
            <button type="submit" class="btn btn-primary">登录</button>
        </form>
    </div>

    <script>
        function reloadCaptcha() {
            $('#captcha-img').attr('src', '/admin/captcha?' + Date.now());
        }
    </script>
</body>

</html>
19.5. auth.controller.ts
src/admin/controllers/auth.controller.ts

import { Controller, Get, Post, Body, Res, Session, Redirect } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from 'src/shared/services/user.service';
import { UtilityService } from 'src/shared/services/utility.service';
@Controller('admin')
export class AuthController {
    constructor(
        private readonly userService: UserService,
        private readonly utilityService: UtilityService,
    ) { }

    @Get('login')
    showLogin(@Res() res: Response) {
        res.render('auth/login', { layout: false });
    }

    @Post('login')
    async login(@Body() body, @Res() res: Response, @Session() session) {
        const { username, password, captcha } = body;
        if (captcha?.toLowerCase() !== session.captcha?.toLowerCase()) {
            return res.render('auth/login', { message: '验证码错误', layout: false });
        }
        const user = await this.userService.findOne({ where: { username }, relations: ['roles', 'roles.accesses'] });
        if (user && await this.utilityService.comparePassword(password, user.password)) {
            session.user = user;
            return res.redirect('/admin/dashboard');
        } else {
            return res.render('auth/login', { message: '用户名或密码错误', layout: false });
        }
    }

    @Get('captcha')
    getCaptcha(@Res() res: Response, @Session() session) {
        const captcha = this.utilityService.generateCaptcha({ size: 1, ignoreChars: '0o1il' });
        session.captcha = captcha.text;
        res.type('svg');
        res.send(captcha.data);
    }

    @Get('logout')
    @Redirect('login')
    logout(@Session() session) {
        session.user = null;
        return { url: 'login' };
    }
}

19.6. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';
import { useContainer } from 'class-validator';
import * as helpers from 'src/shared/helpers'
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
    helpers,
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
  app.use(session({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
  app.useGlobalPipes(new I18nValidationPipe({ transform: true }));
  app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: true }));
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('CMS API 描述')
    .setVersion("1.0")
    .addTag('CMS')
    .addCookieAuth('connect.sid')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  await app.listen(3000);
}
bootstrap();
20.菜单权限
20.1. global.d.ts
src/global.d.ts

declare namespace Express {
    interface Multer {
        File: Express.Multer.File;
    }
    interface Request {
+       session: {
+           user: any;
+       };
+   }
+}
+
20.2. header.hbs
views/partials/header.hbs

<nav class="navbar navbar-expand-lg bg-light">
    <div class="container-fluid">
        <a class="navbar-brand" href="/admin/dashboard">CMS</a>
        <div class="collapse navbar-collapse">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item dropdown">
+                   <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">欢迎, {{user.username}}</a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="/admin/logout">退出登录</a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
20.3. sidebar.hbs
views/partials/sidebar.hbs

<div class="col-md-3 col-lg-2 p-0">
    <div class="accordion" id="sidebarMenu">
+       {{#each menuTree}}
        <div class="accordion-item">
+           <h2 class="accordion-header" id="heading{{id}}">
                <button class="accordion-button" type="button" data-bs-toggle="collapse"
+                   data-bs-target="#collapse{{id}}">
+                   {{name}}
+               </button>
            </h2>
+           <div id="collapse{{id}}" class="accordion-collapse collapse">
                <div class="accordion-body">
                    <ul class="list-group">
+                       {{#each children}}
                        <li class="list-group-item">
+                           <a href="{{url}}">{{name}}</a>
                        </li>
+                       {{/each}}
                    </ul>
                </div>
            </div>
        </div>
+       {{/each}}
    </div>
</div>
20.4. admin.module.ts
src/admin/admin.module.ts

+import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { UserController } from './controllers/user.controller';
import { RoleController } from "./controllers/role.controller";
import { AccessController } from "./controllers/access.controller";
import { TagController } from "./controllers/tag.controller";
import { ArticleController } from "./controllers/article.controller";
import { CategoryController } from "./controllers/category.controller";
import { UploadController } from './controllers/upload.controller';
import { SettingController } from './controllers/setting.controller';
import { AuthController } from './controllers/auth.controller';
+import { AuthMiddleware } from './middlewares/auth.middleware';
@Module({
    controllers: [DashboardController, UserController, RoleController, AccessController, TagController, ArticleController, CategoryController, UploadController, SettingController, AuthController]
})
+export class AdminModule implements NestModule {
+   configure(consumer: MiddlewareConsumer) {
+       consumer
+           .apply(AuthMiddleware).exclude('/admin/login', '/admin/captcha', '/admin/logout').forRoutes('/admin/*');
+   }
}

20.5. auth.middleware.ts
src/admin/middlewares/auth.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { match } from 'path-to-regexp';
import { AccessService } from 'src/shared/services/access.service';
import { Access } from 'src/shared/entities/access.entity';
import { AccessType } from 'src/shared/dto/access.dto';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly accessService: AccessService) { }
    async use(req: Request, res: Response, next: NextFunction) {
        const user = req.session.user;
        //const user = { is_super: true, roles: [] }
        if (!user) {
            return res.redirect('/admin/login');
        }

        res.locals.user = user;

        const accessTree = await this.accessService.findAll();
        const userAccessIds = this.getUserAccessIds(user);
        res.locals.menuTree = user.is_super ? accessTree : this.getMenuTree(accessTree, userAccessIds);
        if (user.is_super || req.originalUrl === '/admin/dashboard') {
            return next();
        }

        if (this.hasPermission(user, req.originalUrl)) {
            return next();
        } else {
            res.status(403).render('error', { message: '无权限访问此页面', layout: false });
        }
    }

    private getUserAccessIds(user): number[] {
        return user.roles.flatMap(role => role.accesses.map(access => access.id));
    }

    private getMenuTree(accessTree: Access[], userAccessIds: number[]): Access[] {
        return accessTree.filter(access => {
            if (access.type === AccessType.FEATURE || !userAccessIds.includes(access.id)) {
                return false;
            }
            if (access.children) {
                access.children = this.getMenuTree(access.children, userAccessIds);
            }
            return true;
        });
    }

    private hasPermission(user, url: string): boolean {
        const userAccessUrls = user.roles.flatMap(role => role.accesses.map(access => access.url));
        return userAccessUrls.some(urlPattern => match(urlPattern)(url));
    }
}

21.Redis会话
npm i ioredis connect-redis 
21.1. redis.service.ts
src/shared/services/redis.service.ts

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigurationService } from './configuration.service';
@Injectable()
export class RedisService implements OnModuleDestroy {
    private redisClient: Redis;
    constructor(
        private configurationService: ConfigurationService
    ) {
        this.redisClient = new Redis({
            host: this.configurationService.redisHost,
            port: this.configurationService.redisPort,
            password: this.configurationService.redisPassword
        });
    }

    onModuleDestroy() {
        this.redisClient.quit();
    }

    getClient(): Redis {
        return this.redisClient;
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.redisClient.set(key, value, 'EX', ttl);
        } else {
            await this.redisClient.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.redisClient.get(key);
    }

    async del(key: string): Promise<void> {
        await this.redisClient.del(key);
    }
}

21.2. configuration.service.ts
src/shared/services/configuration.service.ts

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class ConfigurationService {
    constructor(private configService: ConfigService) { }
    get mysqlHost(): string {
        return this.configService.get<string>('MYSQL_HOST');
    }
    get mysqlPort(): number {
        return this.configService.get<number>('MYSQL_PORT');
    }
    get mysqlDB(): string {
        return this.configService.get<string>('MYSQL_DB');
    }
    get mysqlUser(): string {
        return this.configService.get<string>('MYSQL_USER');
    }
    get mysqlPassword(): string {
        return this.configService.get<string>('MYSQL_PASSWORD');
    }
    get mysqlConfig() {
        return {
            host: this.mysqlHost,
            port: this.mysqlPort,
            database: this.mysqlDB,
            username: this.mysqlUser,
            password: this.mysqlPassword
        }
    }
    get mongodbHost(): string {
        return this.configService.get<string>('MONGO_HOST');
    }
    get mongodbPort(): number {
        return this.configService.get<number>('MONGO_PORT');
    }
    get mongodbDB(): string {
        return this.configService.get<string>('MONGO_DB');
    }
    get mongodbUser(): string {
        return this.configService.get<string>('MONGO_USER');
    }
    get mongodbPassword(): string {
        return this.configService.get<string>('MONGO_PASSWORD');
    }
    get mongodbConfig() {
        return {
            uri: `mongodb://${this.mongodbHost}:${this.mongodbPort}/${this.mongodbDB}`
        }
    }
+   get redisHost(): string {
+       return this.configService.get<string>('REDIS_HOST');
+   }
+   get redisPort(): number {
+       return this.configService.get<number>('REDIS_PORT');
+   }
+   get redisPassword(): string {
+       return this.configService.get<string>('REDIS_PASSWORD');
+   }
+   get redisConfig() {
+       return {
+           host: this.redisHost,
+           port: this.redisPort,
+           password: this.redisPassword
+       }
+   }
}
21.3. main.ts
src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationPipe, I18nValidationExceptionFilter } from 'nestjs-i18n';
import { useContainer } from 'class-validator';
+import * as helpers from 'src/shared/helpers';
+import RedisStore from 'connect-redis';
+import { RedisService } from 'src/shared/services/redis.service';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('hbs', engine({
    extname: '.hbs',
    helpers,
    runtimeOptions: {
      allowProtoMethodsByDefault: true,
      allowProtoPropertiesByDefault: true
    }
  }));
  app.set('view engine', 'hbs');
  app.use(cookieParser());
+ const redisService = app.get(RedisService);
+ const redisClient = redisService.getClient();
  app.use(session({
+   store: new RedisStore({ client: redisClient }),
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  }));
  app.useGlobalPipes(new I18nValidationPipe({ transform: true }));
  app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: true }));
  const config = new DocumentBuilder()
    .setTitle('CMS API')
    .setDescription('CMS API 描述')
    .setVersion("1.0")
    .addTag('CMS')
    .addCookieAuth('connect.sid')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);
  await app.listen(3000);
}
bootstrap();

21.4. shared.module.ts
src/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationService } from './services/configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { IsUsernameUniqueConstraint } from './validators/user-validator';
import { UtilityService } from './services/utility.service';
import { Role } from "./entities/role.entity";
import { RoleService } from "./services/role.service";
import { Access } from "./entities/access.entity";
import { AccessService } from "./services/access.service";
import { Tag } from "./entities/tag.entity";
import { TagService } from "./services/tag.service";
import { Article } from "./entities/article.entity";
import { ArticleService } from "./services/article.service";
import { Category } from "./entities/category.entity";
import { CategoryService } from "./services/category.service";
import { CosService } from './services/cos.service';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { WordExportService } from './services/word-export.service';
import { PptExportService } from './services/ppt-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { SettingService } from './services/setting.service';
import { DashboardService } from './services/dashboard.service';
import { WeatherService } from "./services/weather.service";
import { SystemService } from './services/system.service';
+import { RedisService } from './services/redis.service';
@Global()
@Module({
+   providers: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService, WeatherService, SystemService, RedisService],
+   exports: [IsUsernameUniqueConstraint, ConfigurationService, UtilityService, UserService, RoleService, AccessService, TagService, ArticleService, CategoryService, CosService, NotificationService, MailService, WordExportService, PptExportService, ExcelExportService, SettingService, DashboardService, WeatherService, SystemService, RedisService],
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                uri: configurationService.mongodbConfig.uri
            }),
        }),
        MongooseModule.forFeature([
            { name: Setting.name, schema: SettingSchema },
        ]),
        TypeOrmModule.forRootAsync({
            inject: [ConfigurationService],
            useFactory: (configurationService: ConfigurationService) => ({
                type: 'mysql',
                ...configurationService.mysqlConfig,
                autoLoadEntities: true,
                synchronize: true,
                logging: false,
            })
        }),
        TypeOrmModule.forFeature([User, Role, Access, Tag, Article, Category])
    ],
})
export class SharedModule {
}

CKEditor 5
ckeditor5是一个现代的开源富文本编辑器，提供了高度灵活和可扩展的框架，适用于各种 Web 应用。与前几代的 CKEditor 相比，CKEditor 5 是一次彻底的重构，采用了现代的 JavaScript 技术和架构，具有模块化、可扩展、易用和性能优异等特点。

1. 架构概览
CKEditor 5 的架构围绕模块化和插件化设计，核心部分仅包含基本的编辑器框架，而具体的功能如格式化文本、插入图片、创建表格等都是通过插件来实现的。CKEditor 5 的核心特点包括：

模块化设计: 通过插件扩展功能，开发者可以自由组合功能，创建定制的编辑器。
MVC 架构: CKEditor 5 采用了基于 MVC（Model-View-Controller）的架构，使得数据和界面的分离更加清晰。
实时协作: 支持多人同时编辑文档，并能实时看到其他人的编辑操作。
高度可配置性: 允许开发者通过配置项和 API 深度定制编辑器的行为和外观。
可扩展性: 通过编写自定义插件或扩展现有插件，开发者可以进一步增强编辑器的功能。
2. 主要特性
现代化的用户界面: CKEditor 5 的 UI 基于用户体验的最佳实践，采用了响应式设计，适用于桌面和移动设备。
实时协作: CKEditor 5 内置了实时协作功能，允许多个用户同时编辑同一文档，类似于 Google Docs。
文档编辑模式: CKEditor 5 提供了文档模式和内联模式两种编辑模式。文档模式模拟了传统的文档编辑器（如 Word）的界面，而内联模式则允许在网页中的任何地方直接编辑内容。
数据模型: CKEditor 5 具有先进的数据模型，确保编辑内容的一致性和完整性，尤其是在复杂的文档结构中。
插件和生态系统: CKEditor 5 提供了丰富的插件生态系统，涵盖了从基础的文本格式化到高级的表格、图像处理、媒体嵌入等多种功能。
内置 Markdown 支持: CKEditor 5 支持将内容导出为 Markdown 格式，非常适合需要纯文本输出的场景。
易于集成: CKEditor 5 提供了多种集成方式，支持与现代前端框架（如 React、Angular、Vue.js）以及传统的后端技术（如 Django、Laravel）无缝结合。
3. 安装与使用
CKEditor 5 可以通过多种方式安装和使用：

直接引用 CDN: 如果你只是需要一个简单的编辑器，可以直接从 CDN 引用 CKEditor 5 的构建版本。

<script src="https://cdn.ckeditor.com/ckeditor5/39.0.0/classic/ckeditor.js"></script>
<div id="editor"></div>
<script>
    ClassicEditor
        .create(document.querySelector('#editor'))
        .catch(error => {
            console.error(error);
        });
</script>
通过 npm 安装: 对于更复杂的应用，可以使用 npm 安装 CKEditor 5，并将其集成到你的项目中。

npm install --save @ckeditor/ckeditor5-build-classic
安装后，你可以在你的 JavaScript 代码中导入并初始化 CKEditor 5：

import ClassicEditor from '@ckeditor/ckeditor5-build-classic/src/ckeditor';

ClassicEditor
    .create(document.querySelector('#editor'))
    .catch(error => {
        console.error(error);
    });
4. 编辑器构建
CKEditor 5 提供了多种编辑器构建版本，每个版本包含了不同的默认插件组合，以满足不同的需求：

Classic Editor: 传统的富文本编辑器界面，适用于大多数使用场景。
Inline Editor: 允许直接在网页中的元素上进行编辑，不显示工具栏。
Balloon Editor: 工具栏以气泡的形式显示在编辑内容的上方。
Balloon Block Editor: 类似于 Balloon Editor，但更适合块级内容的编辑。
Decoupled Editor: 工具栏和编辑区域分离的版本，允许将工具栏放置在页面的不同位置。
开发者可以根据需求选择合适的编辑器构建，或者自己通过自定义插件组合构建一个完全定制的 CKEditor 5。

5. 插件系统
CKEditor 5 的插件系统是其灵活性的核心。每个插件都是一个独立的模块，可以根据需要启用或禁用。插件可以实现各种功能，例如文本格式化、图像处理、表格、媒体嵌入、代码块等。

插件安装: 可以通过 npm 安装官方插件或第三方插件。

npm install --save @ckeditor/ckeditor5-basic-styles @ckeditor/ckeditor5-image
启用插件: 在编辑器配置中启用插件。

import ClassicEditor from '@ckeditor/ckeditor5-build-classic/src/ckeditor';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';

ClassicEditor
    .create(document.querySelector('#editor'), {
        plugins: [Bold, Italic],
        toolbar: ['bold', 'italic']
    })
    .catch(error => {
        console.error(error);
    });
6. 自定义与扩展
CKEditor 5 允许开发者创建自定义插件或扩展现有插件，以满足特定需求。开发者可以使用 JavaScript 创建插件，定义其行为和界面，并将其集成到编辑器中。

创建自定义插件: 自定义插件可以实现特定的功能，例如一个新的按钮或工具。

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

class MyPlugin extends Plugin {
    init() {
        const editor = this.editor;

        editor.ui.componentFactory.add('myButton', locale => {
            const view = new ButtonView(locale);

            view.set({
                label: 'My Button',
                withText: true,
                tooltip: true
            });

            view.on('execute', () => {
                console.log('My Button was clicked!');
            });

            return view;
        });
    }
}

ClassicEditor
    .create(document.querySelector('#editor'), {
        plugins: [MyPlugin],
        toolbar: ['myButton']
    })
    .catch(error => {
        console.error(error);
    });
7. 集成与使用
CKEditor 5 具有广泛的集成功能，可以与各种前端框架（如 React、Angular、Vue.js）以及后端框架（如 Django、Laravel）无缝集成。

React 集成: 通过 CKEditor 5 的官方 React 组件，可以轻松地将 CKEditor 5 集成到 React 应用中。

npm install --save @ckeditor/ckeditor5-react @ckeditor/ckeditor5-build-classic
在 React 中使用：

import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const MyComponent = () => (
    <CKEditor
        editor={ ClassicEditor }
        data="<p>Hello from CKEditor 5!</p>"
        onReady={ editor => {
            console.log('Editor is ready to use!', editor);
        } }
        onChange={ (event, editor) => {
            const data = editor.getData();
            console.log({ event, editor, data });
        } }
        onBlur={ (event, editor) => {
            console.log('Blur.', editor);
        } }
        onFocus={ (event, editor) => {
            console.log('Focus.', editor);
        } }
    />
);
Angular 集成: 通过 CKEditor 5 的官方 Angular 组件，可以将 CKEditor 5 集成到 Angular 项目中。

npm install --save @ckeditor/ckeditor5-angular @ckeditor/ckeditor5-build-classic
在 Angular 中使用：

import { Component } from '@angular/core';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
    selector: 'app-root',
    template: `<ckeditor [editor]="Editor" data="<p>Hello from CKEditor 5!</p>"></ckeditor>`,
})
export class AppComponent {
    public Editor = ClassicEditor;
}
Vue.js 集成: Vue.js 的 CKEditor 5 集成也是通过官方组件来实现的。

  npm install --save @ckeditor/ckeditor5-vue @ckeditor/ckeditor5-build-classic
在 Vue.js 中使用：

  import Vue from 'vue';
  import CKEditor from '@ckeditor/ckeditor5-vue';
  import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

  Vue.use(CKEditor);

  new Vue({
      el: '#app',
      data: {
          editor: ClassicEditor,
          editorData: '<p>Hello from CKEditor 5!</p>',
      }
  });
8. 高级功能
实时协作: CKEditor 5 内置了实时协作功能，支持多个用户同时编辑同一文档。需要使用 CKEditor 提供的付费服务来启用此功能。
多语言支持: CKEditor 5 提供了多语言支持，可以根据用户的语言设置自动切换编辑器的语言。
自定义数据处理: 通过自定义数据处理，你可以控制编辑器如何处理输入和输出数据，包括格式、标签过滤等。
安全性: CKEditor 5 在处理 HTML 内容时非常注重安全性，默认会对潜在的 XSS 攻击进行过滤。
9. 总结
CKEditor 5 是一个强大且灵活的富文本编辑器，它不仅适用于简单的文本编辑任务，还可以处理复杂的文档编辑需求。通过其模块化设计和插件系统，CKEditor 5 可以轻松地集成到各种 Web 应用中，同时还提供了丰富的 API 供开发者进行深度定制。无论是构建一个简单的博客平台，还是开发一个复杂的内容管理系统，CKEditor 5 都能为你提供可靠的解决方案。

Simple Upload Adapter
Simple Upload Adapter

Simple Upload Adapter 是 CKEditor 5 中用于实现文件上传的一个插件。它提供了一种简单的方式，将文件（通常是图片）从编辑器直接上传到服务器。Simple Upload Adapter 是一个入门级的上传解决方案，适用于不需要复杂上传逻辑的场景。

1. 工作原理
Simple Upload Adapter 的工作原理非常简单：当用户在编辑器中插入文件（例如通过拖放或选择文件）时，适配器会捕获该文件，并将其上传到服务器。一旦上传成功，服务器会返回文件的 URL，适配器将该 URL 插入到编辑器中，使文件显示在文档中。

2. 配置 Simple Upload Adapter
要使用 Simple Upload Adapter，需要在初始化 CKEditor 5 时进行相应的配置。你需要指定一个上传的 URL，文件会被上传到这个 URL，并且服务器返回的响应中需要包含上传文件的 URL。

以下是配置 Simple Upload Adapter 的步骤：

安装 CKEditor 5 并加载插件

通常，CKEditor 5 的一些构建版本（如 ClassicEditor）已经包含了 Simple Upload Adapter 插件。如果你自己构建 CKEditor 5，请确保包含 SimpleUploadAdapter 插件。

示例代码（假设已经安装了 CKEditor 5）：

import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
配置上传适配器

在初始化编辑器时，配置 simpleUpload 插件，指定 uploadUrl 作为上传的目标 URL：

ClassicEditor
    .create(document.querySelector('#editor'), {
        simpleUpload: {
            // The URL that the images are uploaded to.
            uploadUrl: 'https://your-server.com/upload',

            // Enable the XMLHttpRequest.withCredentials property.
            withCredentials: true,

            // Headers sent along with the XMLHttpRequest to the upload server.
            headers: {
                'X-CSRF-TOKEN': 'CSRF-Token',
                Authorization: 'Bearer <JSON Web Token>'
            }
        }
    })
    .catch(error => {
        console.error(error);
    });
uploadUrl: 必须配置，它是文件上传的服务器端处理地址。用户在编辑器中插入文件时，文件会被上传到这个 URL。
withCredentials: 如果需要跨域请求并发送凭据（如 cookies），可以设置为 true。
headers: 可以配置额外的 HTTP 请求头，比如身份验证的 token 或 CSRF 保护。
3. 服务器端处理
服务器端需要处理上传请求并返回一个包含文件 URL 的 JSON 响应。上传的文件通常以 FormData 的形式发送到服务器，服务器需要将文件存储在适当的位置，并将文件的可访问 URL 返回给客户端。

示例（Node.js Express 服务器）：

const express = require('express');
const multer  = require('multer');
const path = require('path');
const app = express();

// 设置 multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // 保存文件时，使用时间戳命名
    }
});
const upload = multer({ storage: storage });

// 处理文件上传请求
app.post('/upload', upload.single('upload'), function (req, res) {
    // 返回文件的 URL
    res.json({
        url: `/uploads/${req.file.filename}`
    });
});

app.listen(3000, () => console.log('Server started on port 3000'));
这个服务器代码处理文件上传并将文件保存在 uploads/ 目录中，然后返回文件的 URL 供 CKEditor 5 使用。

4. 返回数据格式
服务器端应该返回以下格式的 JSON 响应：

{
    "url": "https://your-server.com/uploads/filename.jpg"
}
url: 这是文件的公开访问路径。CKEditor 5 将使用此 URL 在编辑器中显示上传的文件。
5. 使用场景
Simple Upload Adapter 适合以下场景：

轻量级文件上传: 需要实现简单的文件上传功能，不需要复杂的文件处理逻辑。
快速集成: 需要快速将文件上传功能集成到现有的 CKEditor 5 实例中。
静态资源服务器: 文件上传到服务器后即可通过 URL 访问，无需进一步的处理。
6. 限制与注意事项
仅适用于简单场景: Simple Upload Adapter 适用于简单的文件上传场景，如果需要更复杂的功能（如多文件上传、进度显示、错误处理、文件压缩等），需要自定义适配器或使用其他高级上传插件。
服务器端安全性: 服务器端应确保上传过程的安全性，防止不安全文件或恶意代码上传到服务器。可以使用文件类型验证、大小限制等措施来增强安全性。
7. 总结
Simple Upload Adapter 是 CKEditor 5 提供的一个非常简单且易于配置的文件上传适配器。它适合那些不需要复杂上传逻辑的应用场景，但对于更复杂的需求，可能需要选择更高级的上传解决方案或自定义适配器。通过了解并使用 Simple Upload Adapter，你可以轻松地在 Web 应用中实现基础的文件上传功能。

CKEditor 插件
编写 CKEditor 插件可以让你扩展编辑器的功能，增加自定义的行为或界面元素。以下是编写 CKEditor 5 插件的基本步骤和核心概念。

1. 了解 CKEditor 插件架构
CKEditor 5 是基于模块化和插件化的架构构建的。每个功能几乎都是通过插件实现的。插件可以控制编辑器的行为、添加新的命令、修改 UI 元素，甚至改变编辑器的数据处理方式。

2. 设置开发环境
首先，需要确保你有一个基本的 CKEditor 5 环境，可以通过 npm 或 yarn 来安装 CKEditor 5 的源代码。

npm install --save @ckeditor/ckeditor5-core @ckeditor/ckeditor5-basic-styles
你可以使用 webpack 或其他打包工具来构建你的 CKEditor 5 项目。

3. 创建插件基础结构
插件通常是一个继承自 Plugin 基类的类。以下是一个简单的插件框架：

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class MyCustomPlugin extends Plugin {
    init() {
        console.log('MyCustomPlugin is initialized.');
    }
}
4. 实现插件功能
插件的核心功能在 init() 方法中实现。你可以在这里注册命令、修改编辑器的行为，或者添加新的 UI 组件。

4.1. 添加自定义命令
命令是 CKEditor 5 中的一个核心概念。命令通常表示一个可以由用户触发的操作，比如加粗文本、插入图像等。

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Command from '@ckeditor/ckeditor5-core/src/command';

class MyCustomCommand extends Command {
    execute() {
        // 在这里执行命令的逻辑
        console.log('MyCustomCommand is executed.');
    }

    refresh() {
        // 在这里更新命令的状态（例如启用/禁用）
        this.isEnabled = true;
    }
}

export default class MyCustomPlugin extends Plugin {
    init() {
        // 注册自定义命令
        this.editor.commands.add('myCustomCommand', new MyCustomCommand(this.editor));
    }
}
你可以通过调用 editor.execute('myCustomCommand') 来触发这个命令。

4.2. 添加按钮到工具栏
如果你希望用户可以通过工具栏按钮来触发你的命令，你需要添加一个按钮：

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import icon from './path-to-icon.svg'; // 导入图标

export default class MyCustomPlugin extends Plugin {
    init() {
        const editor = this.editor;
        // 注册按钮并将其与命令关联
        editor.ui.componentFactory.add('myCustomButton', locale => {
            const view = new ButtonView(locale);
            view.set({
                label: 'My Custom Button',
                icon: icon, // 设置按钮的图标
                tooltip: true
            });
            // 绑定按钮的执行行为
            view.on('execute', () => {
                editor.execute('myCustomCommand');
            });

            return view;
        });
    }
}
然后，你需要在配置编辑器时，将你的按钮添加到工具栏中：

ClassicEditor
    .create(document.querySelector('#editor'), {
        plugins: [ MyCustomPlugin ],
        toolbar: [ 'myCustomButton' ]
    })
    .catch(error => {
        console.error(error);
    });
4.3. 修改编辑器内容
你可以通过修改编辑器模型来改变内容。例如，添加一个自定义的文本格式化命令：

class InsertTextCommand extends Command {
    execute() {
        const model = this.editor.model;
        model.change(writer => {
            const textNode = writer.createText('Hello, world!');
            model.insertContent(textNode, model.document.selection);
        });
    }
}

export default class InsertTextPlugin extends Plugin {
    init() {
        this.editor.commands.add('insertText', new InsertTextCommand(this.editor));
    }
}
5. 扩展编辑器的 Schema
CKEditor 5 有一个强大的 schema（模式）系统，用于定义编辑器中允许的内容结构。如果你希望引入新的内容类型，比如自定义的 HTML 标签或属性，你需要扩展编辑器的 schema。

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class MySchemaPlugin extends Plugin {
    init() {
        const schema = this.editor.model.schema;
        // 注册自定义元素
        schema.register('customElement', {
            isObject: true,
            allowWhere: '$block',
            allowAttributes: ['name']
        });
    }
}
6. 处理数据转换
CKEditor 5 有自己的数据模型，为了正确处理自定义元素或内容，你可能需要编写自定义的转换器来处理从模型到视图、视图到模型的转换。

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';

export default class MySchemaPlugin extends Plugin {
    init() {
        const editor = this.editor;
        const conversion = editor.conversion;

        // 视图 -> 模型
        conversion.for('upcast').elementToElement({
            model: 'customElement',
            view: {
                name: 'div',
                classes: 'custom-element'
            }
        });

        // 模型 -> 视图
        conversion.for('dataDowncast').elementToElement({
            model: 'customElement',
            view: (modelElement, viewWriter) => {
                return viewWriter.createContainerElement('div', { class: 'custom-element' });
            }
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'customElement',
            view: (modelElement, viewWriter) => {
                const widget = viewWriter.createContainerElement('div', { class: 'custom-element' });
                return toWidget(widget, viewWriter);
            }
        });
    }
}
7. 测试与调试
在完成插件的开发后，确保通过各种场景对插件进行测试。使用 CKEditor 5 的内置调试工具或浏览器的开发者工具来监控插件的行为和性能。

8. 发布和分享插件
当你的插件开发完成并经过测试后，可以将其发布到 npm 或 GitHub，以便其他开发者可以使用和贡献。如果你计划长期维护该插件，建议编写详细的文档。

9. 总结
编写 CKEditor 5 插件是一项有趣且强大的任务，允许你根据需求自定义编辑器的行为。CKEditor 5 的模块化设计使得插件开发变得相对简单，通过遵循上述步骤，你可以创建功能强大且易于集成的插件。通过深入理解 CKEditor 5 的架构和功能，你可以实现从简单的按钮命令到复杂的内容处理等多种扩展。

@nestjs/event-emitter
@nestjs/event-emitter 是一个 NestJS 模块，提供了事件驱动的编程模型，使得在应用中发布和订阅事件变得更加简单和高效。这个模块基于 eventemitter2，允许你在 NestJS 应用中使用事件发布-订阅（Pub-Sub）模式，这对于解耦组件、处理异步任务和实现跨模块通信非常有用。

1. 安装
首先，你需要在 NestJS 项目中安装 @nestjs/event-emitter 包：

npm install @nestjs/event-emitter eventemitter2
2. 模块配置
在使用 EventEmitterModule 之前，需要将其导入到应用的模块中。

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppService } from './app.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true, // 支持通配符事件
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
3. 事件的发布和订阅
3.1. 发布事件
你可以通过 EventEmitter2 的实例来发布事件。在 NestJS 中，可以通过依赖注入的方式来获取 EventEmitter2 实例。

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AppService {
  constructor(private eventEmitter: EventEmitter2) {}

  someMethod() {
    // 发布事件
    this.eventEmitter.emit('user.created', { name: 'John Doe' });
  }
}
在上面的例子中，我们发布了一个 user.created 事件，携带了一个包含用户信息的对象作为事件数据。

3.2. 订阅事件
你可以通过装饰器 @OnEvent 来订阅事件，并定义事件发生时的处理逻辑。

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class UserListener {
  @OnEvent('user.created')
  handleUserCreatedEvent(payload: any) {
    // 处理事件
    console.log('用户创建事件已接收，数据:', payload);
  }
}
当 user.created 事件被发布时，handleUserCreatedEvent 方法会被调用，并接收发布时传递的事件数据。

4. 通配符事件
@nestjs/event-emitter 支持使用通配符来订阅一类事件。例如，如果你想订阅所有 user 相关的事件，可以使用通配符：

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class UserListener {
  @OnEvent('user.*')
  handleUserEvents(event: string, payload: any) {
    console.log(`接收到事件 ${event}，数据:`, payload);
  }
}
上面的代码将会监听所有以 user. 开头的事件，例如 user.created、user.updated 等。

5. 异步事件处理
事件处理函数可以是异步的，这在需要进行异步操作时非常有用。你可以简单地将事件处理函数声明为 async：

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class UserListener {
  @OnEvent('user.created')
  async handleUserCreatedEvent(payload: any) {
    // 执行异步操作
    await someAsyncOperation(payload);
    console.log('用户创建事件已异步处理');
  }
}
6. 事件优先级
@nestjs/event-emitter 允许你为事件处理器设置优先级，优先级高的处理器会先执行。你可以在 @OnEvent 装饰器中设置 priority 选项：

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class UserListener {
  @OnEvent('user.created', { priority: 1 }) // 优先级为1，较高
  handleUserCreatedEventHighPriority(payload: any) {
    console.log('高优先级处理器已执行');
  }

  @OnEvent('user.created', { priority: 10 }) // 优先级为10，较低
  handleUserCreatedEventLowPriority(payload: any) {
    console.log('低优先级处理器已执行');
  }
}
在上面的例子中，当 user.created 事件被发布时，handleUserCreatedEventHighPriority 会在 handleUserCreatedEventLowPriority 之前执行。

7. 全局事件处理器
如果你需要在整个应用中对某个事件进行监听，可以使用全局事件处理器。全局事件处理器可以通过在模块中全局注册来实现：

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserListener } from './user.listener';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: 'GLOBAL_EVENT_LISTENER',
      useClass: UserListener, // 将监听器作为全局监听器注册
    },
  ],
})
export class AppModule {}
8. 总结
@nestjs/event-emitter 模块为 NestJS 提供了一个强大且灵活的事件驱动模型，使得应用程序的组件之间可以通过事件进行松耦合的通信。它支持同步和异步事件处理，允许使用通配符订阅事件，并可以为事件处理器设置优先级。这些功能使得 @nestjs/event-emitter 成为处理复杂应用场景的理想选择，特别是在处理跨模块通信和异步任务时。

COS Node.js SDK v5
cos-nodejs-sdk-v5 是腾讯云对象存储（COS）服务的官方 Node.js SDK。它提供了方便的 API，使开发者可以轻松地在 Node.js 应用中集成和操作 COS 服务，如上传文件、下载文件、管理存储桶（Bucket）等。

1. 安装
要使用 cos-nodejs-sdk-v5，首先需要在 Node.js 项目中安装它：

npm install cos-nodejs-sdk-v5 --save
2. 初始化 SDK
在使用 SDK 前，需要初始化一个 COS 实例。初始化时需要提供腾讯云的 SecretId 和 SecretKey，这些凭证可以在 腾讯云控制台 获取。

const COS = require('cos-nodejs-sdk-v5');

// 初始化 COS 实例
const cos = new COS({
    SecretId: 'your-secret-id',
    SecretKey: 'your-secret-key',
});
3. 常用操作
cos-nodejs-sdk-v5 提供了一系列 API 用于操作 COS 服务。以下是一些常用的操作示例：

3.1. 创建存储桶（Bucket）
创建一个存储桶，用于存储文件。存储桶名称需要在同一区域内全局唯一。

cos.putBucket({
    Bucket: 'examplebucket-1250000000',  // 存储桶名称，必须以 "-APPID" 结尾
    Region: 'ap-guangzhou',              // 存储桶所在区域
}, (err, data) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Bucket Created:', data);
    }
});
3.2. 上传文件
将本地文件上传到 COS 存储桶中。

cos.putObject({
    Bucket: 'examplebucket-1250000000', // 存储桶名称
    Region: 'ap-guangzhou',             // 存储桶所在区域
    Key: 'exampleobject.jpg',           // 存储在存储桶中的文件名
    Body: fs.createReadStream('localfile.jpg'), // 本地文件路径
}, (err, data) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('File Uploaded:', data);
    }
});
3.3. 下载文件
从 COS 存储桶中下载文件到本地。

cos.getObject({
    Bucket: 'examplebucket-1250000000', // 存储桶名称
    Region: 'ap-guangzhou',             // 存储桶所在区域
    Key: 'exampleobject.jpg',           // 存储桶中的文件名
}, (err, data) => {
    if (err) {
        console.error('Error:', err);
    } else {
        fs.writeFileSync('downloadedfile.jpg', data.Body); // 将文件保存到本地
        console.log('File Downloaded');
    }
});
3.4. 列出存储桶中的文件
列出指定存储桶中的所有对象（文件）。

cos.getBucket({
    Bucket: 'examplebucket-1250000000', // 存储桶名称
    Region: 'ap-guangzhou',             // 存储桶所在区域
}, (err, data) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Bucket Contents:', data.Contents);
    }
});
3.5. 删除文件
删除存储桶中的指定文件。

cos.deleteObject({
    Bucket: 'examplebucket-1250000000', // 存储桶名称
    Region: 'ap-guangzhou',             // 存储桶所在区域
    Key: 'exampleobject.jpg',           // 要删除的文件名
}, (err, data) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('File Deleted:', data);
    }
});
3.6. 删除存储桶
删除指定的存储桶。注意，删除存储桶之前，必须确保存储桶为空（无任何文件或目录）。

cos.deleteBucket({
    Bucket: 'examplebucket-1250000000', // 存储桶名称
    Region: 'ap-guangzhou',             // 存储桶所在区域
}, (err, data) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Bucket Deleted:', data);
    }
});
4. 高级功能
4.1. 分块上传（大文件上传）
对于大文件上传，COS SDK 提供了分块上传的功能，可以将文件分割成多个小块并行上传，提高上传效率，并且在传输过程中如果出现问题，可以只重新上传出错的部分。

cos.sliceUploadFile({
    Bucket: 'examplebucket-1250000000',
    Region: 'ap-guangzhou',
    Key: 'largefile.zip',
    FilePath: 'path/to/local/largefile.zip'
}, (err, data) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Large File Uploaded:', data);
    }
});
4.2. 设置对象的访问权限
你可以为上传的对象设置访问权限，例如公开读、私有等。

cos.putObjectAcl({
    Bucket: 'examplebucket-1250000000',
    Region: 'ap-guangzhou',
    Key: 'exampleobject.jpg',
    ACL: 'public-read', // 设置文件为公开可读
}, (err, data) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('ACL Set:', data);
    }
});
4.3. 生成预签名 URL
有时你需要为私有对象生成一个预签名 URL，允许用户在指定时间内访问该对象。

const url = cos.getObjectUrl({
    Bucket: 'examplebucket-1250000000',
    Region: 'ap-guangzhou',
    Key: 'exampleobject.jpg',
    Expires: 60, // URL 的有效时间为 60 秒
});

console.log('Pre-Signed URL:', url);
5. 错误处理
在使用 cos-nodejs-sdk-v5 时，需要对可能的错误进行处理。通常情况下，错误会通过回调函数的第一个参数传递。你可以通过查看错误对象中的 code 和 message 来了解错误的具体情况。

cos.putObject({
    Bucket: 'examplebucket-1250000000',
    Region: 'ap-guangzhou',
    Key: 'exampleobject.jpg',
    Body: fs.createReadStream('localfile.jpg'),
}, (err, data) => {
    if (err) {
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
    } else {
        console.log('File Uploaded:', data);
    }
});
6. 总结
cos-nodejs-sdk-v5 是一个功能强大且易于使用的工具，使开发者能够在 Node.js 应用中轻松集成腾讯云对象存储（COS）服务。它支持从基础的文件上传和下载，到高级的分块上传、访问控制和预签名 URL 生成等功能，几乎覆盖了所有与对象存储相关的需求。通过合理使用 SDK，开发者可以构建高效、可扩展的文件管理系统，并利用腾讯云的存储优势为应用提供可靠的数据存储解决方案。

@nestjs/serve-static
@nestjs/serve-static 是 NestJS 提供的一个官方模块，用于在 NestJS 应用中服务静态文件。它基于 Express 或 Fastify 的静态文件中间件，通过简单的配置，使得在 NestJS 应用中服务静态资源变得非常便捷。

1. 主要功能
@nestjs/serve-static 模块主要用于以下场景：

提供静态文件: 如 HTML 文件、CSS、JavaScript、图片、字体等，可以直接通过 HTTP 请求进行访问。
支持多路径配置: 可以为不同的静态文件目录配置不同的路径和路由前缀。
与前端框架集成: 常用于将前端构建后的静态文件（如 Angular、React、Vue 的打包输出）与 NestJS 后端应用集成在一起，形成一个统一的服务。
2. 安装和设置
要使用 @nestjs/serve-static 模块，需要先进行安装：

npm install @nestjs/serve-static
安装后，在你的模块中进行配置，通常是在根模块（如 AppModule）中配置：

import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // 指定静态文件目录
    }),
  ],
})
export class AppModule {}
3. 配置选项
ServeStaticModule.forRoot() 方法接受一个配置对象，可以配置多个属性：

rootPath: （必填）静态文件的根目录路径。所有文件将从这个目录中提供服务。通常使用 path.join() 来构建路径。

rootPath: join(__dirname, '..', 'public'),
serveRoot: （可选）指定一个路由前缀，只有在访问 URL 以这个前缀开头时，静态文件才会被提供。如果不指定，默认情况下文件会从根路径提供。

serveRoot: '/static',
例如，如果 serveRoot 设置为 /static，并且你请求 /static/image.png，它将从 rootPath 指定的目录中查找 image.png。

exclude: （可选）一个字符串或字符串数组，用于排除某些路径，使其不会被静态文件中间件处理。适用于需要保护某些路由或路径不被作为静态文件服务的情况。

exclude: ['/api*', '/auth*'],
serveStaticOptions: （可选）这是一个传递给底层静态文件中间件的选项对象。根据你使用的是 Express 还是 Fastify，可以配置特定的选项。例如，设置缓存控制头或指定最大缓存时间。

serveStaticOptions: {
  cacheControl: true,
  maxAge: 3600, // 1 hour
},
多路径支持: 你可以为不同的目录配置多个 rootPath 和 serveRoot。例如，分别为公共资源和上传文件设置不同的路径：

ServeStaticModule.forRoot([
  {
    rootPath: join(__dirname, '..', 'public'),
    serveRoot: '/public',
  },
  {
    rootPath: join(__dirname, '..', 'uploads'),
    serveRoot: '/uploads',
  },
]),
4. 应用场景
静态网站托管: 如果你有一个前端应用（如 Angular、React、Vue），可以将构建后的静态文件托管在 NestJS 应用中。

ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'client'),
}),
然后在前端项目中构建产物（如 dist 目录）放入 client 文件夹中，NestJS 会将这些文件通过 HTTP 提供服务。

混合应用: 当你希望同时提供 API 和前端页面服务时，可以使用 @nestjs/serve-static。例如，你可以在 /api 路径下提供 REST API 服务，在 / 路径下提供前端页面服务。

文件上传与访问: 你可以将用户上传的文件保存到特定目录，并通过配置 ServeStaticModule 来提供这些文件的访问路径。

5. 注意事项
优先级问题: ServeStaticModule 中定义的路径优先级较高，确保不要让它覆盖了你应用中其他的 API 路由。可以通过 exclude 选项排除不应被处理的路径。
性能优化: 对于高流量的生产环境，建议启用缓存和压缩，并配置合适的缓存控制策略，以减少静态文件的传输次数。
6. 总结
@nestjs/serve-static 模块提供了一种简单而强大的方式，将静态文件与 NestJS 应用集成在一起。它适合处理从单页面应用到复杂的多页面网站的各种场景。通过简单的配置，你可以灵活地定义静态资源的提供路径，并确保这些资源能够高效地服务于用户。

Sharp：高性能图像处理库
Sharp 是一个流行的高性能图像处理库，用于 Node.js 环境中。它支持对各种格式的图像进行快速的转换、调整、裁剪、旋转、合并等操作，且占用的内存和 CPU 资源较少，处理速度非常快。

1. Sharp 的特点
高性能: Sharp 使用了由 libvips 提供支持的底层 C++ 库，与其他基于纯 JavaScript 的图像处理库相比，具有显著的性能优势。
多格式支持: 支持多种图像格式，包括 JPEG、PNG、WebP、TIFF、GIF（静态）、SVG、以及支持的 AVIF 格式。
内存优化: Sharp 通过流式处理和内存优化，可以处理大型图像文件而不会占用大量内存。
功能丰富: 提供了多种图像处理功能，包括调整大小、裁剪、旋转、翻转、添加水印、调整亮度和对比度等。
流支持: 可以将图像处理与 Node.js 流结合，支持管道操作，方便处理大文件。
2. 安装
在 Node.js 项目中使用 Sharp，首先需要安装它：

npm install sharp
Sharp 需要编译，所以安装过程可能稍微耗时。在一些环境下（如 Windows），可能需要一些额外的构建工具来支持编译过程。

3. 基本用法
Sharp 的使用非常直观，通常通过链式调用来执行图像处理操作。以下是一些常见的用法示例：

3.1. 调整图像大小
调整图像大小是 Sharp 最常用的功能之一。例如，将一个图像的宽度调整为 200 像素，高度自动调整以保持比例：

const sharp = require('sharp');

sharp('input.jpg')
  .resize(200)
  .toFile('output.jpg', (err, info) => {
    if (err) throw err;
    console.log(info);
  });
你还可以指定宽度和高度，如果不保持比例，图像会被拉伸或压缩：

sharp('input.jpg')
  .resize(200, 300)
  .toFile('output.jpg', (err, info) => {
    if (err) throw err;
    console.log(info);
  });
3.2. 裁剪图像
裁剪图像也是常见需求，可以使用 resize 方法结合 crop 参数来完成裁剪操作：

在使用 Sharp 进行图像大小调整时，fit 选项决定了图像如何适应给定的宽度和高度。它主要有以下几种模式：

cover: 默认值，裁剪图像以填充给定的尺寸，可能会裁掉一部分图像内容。
contain: 将图像缩放以适应给定的尺寸，但保持整个图像在范围内，可能会出现空白区域。
fill: 拉伸图像以完全填充给定的尺寸，可能会改变图像的宽高比例。
inside: 将图像缩放以适应给定的尺寸，同时确保整个图像都在范围内，保持宽高比例，并且不裁剪图像。
outside: 将图像缩放以覆盖给定的尺寸，保持宽高比例，可能会超出范围，但不会裁剪图像。
sharp('input.jpg')
  .resize(200, 200, {
    fit: sharp.fit.cover, // 裁剪以适应尺寸
    position: sharp.strategy.entropy // 根据图像内容裁剪
  })
  .toFile('output.jpg', (err, info) => {
    if (err) throw err;
    console.log(info);
  });
3.3. 转换图像格式
将图像从一种格式转换为另一种格式非常简单。例如，将一个 JPEG 图像转换为 PNG：

sharp('input.jpg')
  .png()
  .toFile('output.png', (err, info) => {
    if (err) throw err;
    console.log(info);
  });
3.4. 旋转和翻转图像
可以轻松地对图像进行旋转和翻转：

sharp('input.jpg')
  .rotate(90) // 顺时针旋转 90 度
  .flip() // 上下翻转
  .toFile('output.jpg', (err, info) => {
    if (err) throw err;
    console.log(info);
  });
3.5. 添加水印
Sharp 允许通过组合多个图像来添加水印。例如，在一个图像上添加一个透明的水印：

sharp('input.jpg')
  .composite([{ input: 'watermark.png', gravity: 'southeast' }])
  .toFile('output.jpg', (err, info) => {
    if (err) throw err;
    console.log(info);
  });
3.6. 调整图像亮度和对比度
Sharp 还可以调整图像的亮度、对比度、饱和度等参数：

sharp('input.jpg')
  .modulate({
    brightness: 1.2, // 亮度增加 20%
    contrast: 1.5 // 对比度增加 50%
  })
  .toFile('output.jpg', (err, info) => {
    if (err) throw err;
    console.log(info);
  });
4. 处理流式数据
Sharp 可以与 Node.js 的流结合，特别适合处理大文件或实时图像处理。以下是一个简单示例：

const fs = require('fs');
const sharp = require('sharp');

const readStream = fs.createReadStream('input.jpg');
const writeStream = fs.createWriteStream('output.jpg');

readStream
  .pipe(sharp().resize(200))
  .pipe(writeStream);
在这个例子中，input.jpg 被读取，调整大小后直接写入 output.jpg，而无需在内存中加载整个图像。

5. 错误处理
在使用 Sharp 时，可能会遇到一些常见的错误，如文件不存在、文件格式不支持等。你可以通过回调函数或 Promise 处理这些错误：

sharp('input.jpg')
  .resize(200)
  .toFile('output.jpg')
  .then(info => {
    console.log(info);
  })
  .catch(err => {
    console.error('发生错误:', err);
  });
6. 优化图像处理
Sharp 可以通过以下方式进一步优化图像处理：

控制输出质量: 对于 JPEG 和 WebP 格式，可以指定输出质量（1-100）来优化文件大小。

sharp('input.jpg')
  .jpeg({ quality: 80 })
  .toFile('output.jpg');
流式处理: 对于大文件，使用流式处理可以避免高内存占用，并提高处理效率。

缓存: Sharp 通过 libvips 内部的缓存机制优化了性能，确保在处理大量图像时的速度和效率。

7. 总结
Sharp 是一个功能强大且高效的图像处理库，适用于各种图像处理需求。无论是简单的图像格式转换、调整大小，还是复杂的图像合成、实时处理，Sharp 都能胜任。此外，它的高性能和内存优化使得它在处理大批量或高分辨率图像时表现尤为出色。如果你正在开发需要处理图像的 Node.js 应用，Sharp 是一个非常值得推荐的库。

Nodemailer
Nodemailer 是一个用于 Node.js 应用中发送电子邮件的模块。它支持多种邮件传输方式，包括通过 SMTP 发送邮件、使用本地发送邮件的服务、甚至集成第三方邮件服务（如 Gmail、Outlook、SendGrid 等）。Nodemailer 是 Node.js 中最流行的邮件发送库，简单易用，功能强大。

1. 安装
首先，在你的 Node.js 项目中安装 Nodemailer：

npm install nodemailer
2. 基本用法
发送邮件的基本步骤包括创建传输器（Transporter）、设置邮件选项，并调用发送方法。以下是一个简单的示例：

const nodemailer = require('nodemailer');

// 创建一个传输器对象，用于发送邮件
let transporter = nodemailer.createTransport({
    service: 'gmail', // 使用 Gmail 作为邮件服务
    auth: {
        user: 'your-email@gmail.com', // 你的邮箱地址
        pass: 'your-email-password'   // 你的邮箱密码或应用专用密码
    }
});

// 设置邮件选项
let mailOptions = {
    from: 'your-email@gmail.com', // 发件人地址
    to: 'recipient@example.com',  // 收件人地址
    subject: 'Hello ✔',           // 邮件主题
    text: 'Hello world?',          // 纯文本内容
    html: '<b>Hello world?</b>'    // HTML 内容
};

// 发送邮件
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
});
3. 配置传输器（Transporter）
传输器（Transporter）是 Nodemailer 中用于定义邮件传输方式的对象。你可以使用不同的传输协议来发送邮件，如 SMTP、本地邮件传输代理等。

3.1. SMTP 传输器
SMTP 是最常用的邮件传输协议，Nodemailer 支持直接使用 SMTP 服务器发送邮件。

let transporter = nodemailer.createTransport({
    host: 'smtp.example.com',  // SMTP 服务器地址
    port: 587,                 // SMTP 端口
    secure: false,             // 是否使用 TLS，false 表示不使用，通常端口 587 使用明文传输
    auth: {
        user: 'your-email@example.com', // SMTP 登录用户名
        pass: 'your-email-password'     // SMTP 登录密码
    }
});
3.2. 使用 OAuth2 认证
对于某些服务（如 Gmail），你可能需要使用 OAuth2 进行认证。

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'your-email@gmail.com',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        refreshToken: 'your-refresh-token',
        accessToken: 'your-access-token'
    }
});
3.3. 本地邮件传输代理
在某些情况下，你可能希望使用本地的邮件传输代理（如 sendmail 或 postfix）来发送邮件。

let transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
});
4. 邮件选项（Mail Options）
邮件选项是用于定义邮件内容和收件人等信息的对象。

from: 发件人地址
to: 收件人地址，可以是多个地址，用逗号分隔
subject: 邮件主题
text: 纯文本内容
html: HTML 内容
cc: 抄送地址
bcc: 密送地址
attachments: 附件列表，支持文件路径、内容、URL 等形式
4.1. 发送带附件的邮件
你可以通过 attachments 属性发送带有附件的邮件：

let mailOptions = {
    from: 'your-email@gmail.com',
    to: 'recipient@example.com',
    subject: 'Here is your attachment',
    text: 'Please see the attached file.',
    attachments: [
        {
            filename: 'text1.txt', // 文件名
            path: './files/text1.txt' // 文件路径
        },
        {
            filename: 'text2.txt',
            content: 'Hello, World!' // 文件内容
        }
    ]
};
5. 处理发送结果
sendMail 方法是异步的，通常会通过回调函数或 Promise 处理发送结果。你可以在回调中处理发送成功或失败的逻辑。

transporter.sendMail(mailOptions)
    .then(info => {
        console.log('Message sent: %s', info.messageId);
    })
    .catch(error => {
        console.error('Error sending email: ', error);
    });
6. 调试与日志
在开发过程中，你可能需要查看详细的日志以调试邮件发送问题。你可以通过在创建传输器时启用 debug 选项来查看调试信息。

let transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@example.com',
        pass: 'your-email-password'
    },
    logger: true, // 启用日志记录
    debug: true   // 启用调试模式，输出详细的发送过程
});
7. 常见问题
Gmail 安全性设置: 如果你使用 Gmail 发送邮件，你可能需要为你的账户启用“低安全性应用的访问”或使用 OAuth2。
SMTP 端口选择: 如果你使用的是 587 端口，通常是明文传输并支持 STARTTLS。如果你使用的是 465 端口，通常需要启用 secure: true 以使用 SSL/TLS 进行加密。
8. 总结
Nodemailer 是一个强大且灵活的邮件发送工具，它适用于各种场景，从简单的单次邮件发送到复杂的邮件自动化任务。通过合理配置 SMTP、邮件选项和处理发送结果，你可以构建一个稳定、高效的邮件发送系统。无论是个人项目还是企业应用，Nodemailer 都是 Node.js 环境下的首选邮件解决方案。

html-to-docx
html-to-docx 是一个用于将 HTML 内容转换为 Microsoft Word 文档（.docx 格式）的 Node.js 库。这个工具特别适合在 Web 应用中生成 Word 文档，比如在线生成合同、报告、简历等。它的主要功能是将结构化的 HTML 转换为可编辑的 Word 文档，同时保留 HTML 内容的样式和结构。

1. 安装
要在 Node.js 项目中使用 html-to-docx，首先需要安装它：

npm install html-to-docx
2. 基本用法
html-to-docx 提供了一个简单的 API，用于将 HTML 字符串转换为 Word 文档的二进制数据，然后你可以将其保存为文件或通过 HTTP 响应返回给客户端。

const fs = require('fs');
const htmlToDocx = require('html-to-docx');

// 定义要转换的 HTML 内容
const html = `
    <h1>Hello, World!</h1>
    <p>This is a test document generated from HTML.</p>
`;

// 将 HTML 转换为 .docx 二进制数据
htmlToDocx(html)
    .then((docxBuffer) => {
        // 将生成的 .docx 数据保存到文件
        fs.writeFileSync('output.docx', docxBuffer);
        console.log('Word document generated successfully!');
    })
    .catch((error) => {
        console.error('Error generating Word document:', error);
    });
3. API 详解
html-to-docx 提供的主要方法是 htmlToDocx(html, options)，其中：

html: 需要转换的 HTML 字符串。
options: 一个可选的配置对象，用于自定义生成的 .docx 文件。下面将介绍一些常用的选项。
3.1. Options 配置
html-to-docx 支持一些配置选项，可以用来控制生成的 Word 文档的外观和行为。

orientation: 控制文档的页面方向，可以设置为 'portrait' 或 'landscape'。默认值是 'portrait'。

const options = {
    orientation: 'landscape',
};
margins: 控制页面的边距，单位为英寸。可以设置 top、right、bottom 和 left 四个方向的边距。

const options = {
    margins: { top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 },
};
title: 设置生成文档的标题，会显示在 Word 文档的属性中。

const options = {
    title: 'Generated Document',
};
author: 设置生成文档的作者信息。

const options = {
    author: 'John Doe',
};
table: 用于配置表格的样式和行为，包括 rowHeight、cellMargin 等。

const options = {
    table: {
        rowHeight: 0.5,
        cellMargin: 0.1,
    },
};
footer: 添加页脚，可以是简单的文本或复杂的 HTML 结构。

const options = {
    footer: '<p>Page <span class="page-number"></span> of <span class="total-pages"></span></p>',
};
4. 高级用法
4.1. 将复杂的 HTML 转换为 .docx
你可以将带有样式、表格、图像等复杂结构的 HTML 转换为 Word 文档。html-to-docx 会保留大部分 HTML 的结构和样式。

const complexHtml = `
    <h1>Complex Document</h1>
    <p>This document contains a table and an image.</p>
    <table border="1">
        <tr><th>Header 1</th><th>Header 2</th></tr>
        <tr><td>Cell 1</td><td>Cell 2</td></tr>
    </table>
    <img src="data:image/png;base64,iVBORw0..." alt="Sample Image" />
`;

htmlToDocx(complexHtml)
    .then((docxBuffer) => {
        fs.writeFileSync('complex-output.docx', docxBuffer);
    })
    .catch((error) => {
        console.error('Error generating complex Word document:', error);
    });
4.2. 通过 HTTP 响应返回 .docx
在 Web 应用中，你可以通过 HTTP 响应将生成的 .docx 文件返回给客户端，以便用户下载。

const express = require('express');
const app = express();
const htmlToDocx = require('html-to-docx');

app.post('/generate-docx', (req, res) => {
    const html = req.body.html; // 假设 HTML 内容通过 POST 请求发送

    htmlToDocx(html)
        .then((docxBuffer) => {
            res.setHeader('Content-Disposition', 'attachment; filename=output.docx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.send(docxBuffer);
        })
        .catch((error) => {
            res.status(500).send('Error generating document');
        });
});

app.listen(3000, () => console.log('Server is running on port 3000'));
5. 注意事项和局限性
CSS 支持有限: html-to-docx 支持的 CSS 样式有限，主要是基础的排版和格式样式。复杂的 CSS 可能无法正确应用。
图像处理: 图像需要是可访问的 URL 或 base64 编码的数据 URI。如果图像路径不正确，可能无法正确显示。
复杂布局: 虽然 html-to-docx 能够处理大部分 HTML 内容，但对于非常复杂的布局（如浮动、绝对定位等），可能无法完全正确转换。
6. 总结
html-to-docx 是一个强大的工具，适合将 HTML 内容转换为 Word 文档的场景。它易于使用，支持基本的 HTML 和样式，同时也提供了一些定制选项，使你可以控制生成文档的外观和行为。通过合理使用这个工具，你可以在 Web 应用中轻松生成符合需求的 Word 文档，并通过 HTTP 响应直接提供给用户下载。

PptxGenJS
html-pptxgenjs 是一个结合了 PptxGenJS 和 HTML 的库，用于将 HTML 内容转换为 Microsoft PowerPoint 演示文稿（PPTX 格式）。PptxGenJS 是一个用于生成 PowerPoint 文件的 JavaScript 库，而 html-pptxgenjs 则是它的一个扩展，允许你将 HTML 内容直接转换为 PPTX 文件的幻灯片内容。这对于将网页内容或动态生成的 HTML 转换为演示文稿特别有用。

1. 安装
首先，你需要在项目中安装 html-pptxgenjs 和 PptxGenJS 依赖包：

npm install html-pptxgenjs pptxgenjs
2. 基本用法
使用 html-pptxgenjs 将 HTML 转换为 PPTX 文件非常简单。以下是一个基本的用法示例：

const PptxGenJS = require("pptxgenjs");
const { htmlToPptx } = require("html-pptxgenjs");

const htmlContent = `
  <h1>Welcome to My Presentation</h1>
  <p>This slide was generated from HTML content.</p>
  <ul>
    <li>Introduction</li>
    <li>Main Content</li>
    <li>Conclusion</li>
  </ul>
`;

// 创建一个新的演示文稿对象
let pptx = new PptxGenJS();

// 将 HTML 内容转换为 PPTX 幻灯片
htmlToPptx({
  pptx,                 // 传入 PptxGenJS 的演示文稿对象
  html: htmlContent,    // 传入要转换的 HTML 内容
  slideNumber: 1,       // 指定幻灯片的序号
});

// 保存 PPTX 文件
pptx.writeFile("presentation.pptx").then(fileName => {
  console.log(`PPTX file created: ${fileName}`);
});
3. 详细解释
3.1. 创建 PPTX 文件
PptxGenJS 是创建和操作 PowerPoint 演示文稿的核心库。通过它可以创建新的幻灯片、添加文本、图像、形状等。

let pptx = new PptxGenJS(); // 创建一个新的演示文稿对象
3.2. 将 HTML 转换为 PPTX
htmlToPptx 是 html-pptxgenjs 提供的函数，用于将 HTML 内容转换为 PPTX 文件的幻灯片。

htmlToPptx({
  pptx,                 // PptxGenJS 对象
  html: htmlContent,    // 要转换的 HTML 字符串
  slideNumber: 1,       // 插入 HTML 内容的幻灯片编号
});
htmlToPptx 函数会将 HTML 内容转换为与 PowerPoint 幻灯片相匹配的格式。支持的 HTML 元素包括标题、段落、列表、表格、图像等。

3.3. 保存文件
pptx.writeFile 是 PptxGenJS 提供的方法，用于将生成的 PowerPoint 演示文稿保存为文件。

pptx.writeFile("presentation.pptx").then(fileName => {
  console.log(`PPTX file created: ${fileName}`);
});
4. 高级用法
4.1. 自定义样式和布局
你可以在 HTML 中使用内联样式或 CSS 类来自定义文本、图片、表格等元素的外观。这些样式会被尽可能地转换到 PPTX 文件中。

const htmlContent = `
  <h1 style="color: blue;">Welcome to My Presentation</h1>
  <p style="font-size: 18px;">This slide was generated from HTML content.</p>
  <ul style="list-style-type: square;">
    <li>Introduction</li>
    <li>Main Content</li>
    <li>Conclusion</li>
  </ul>
`;
4.2. 多张幻灯片
你可以根据需要创建多张幻灯片，并在不同的幻灯片中插入不同的 HTML 内容。

htmlToPptx({ pptx, html: htmlContent1, slideNumber: 1 });
htmlToPptx({ pptx, html: htmlContent2, slideNumber: 2 });
4.3. 插入图像
html-pptxgenjs 也支持在 HTML 中插入图像，这些图像将被转换为 PPTX 文件中的图像元素。

const htmlContent = `
  <h1>Presentation with Images</h1>
  <img src="https://example.com/image.png" alt="Sample Image" style="width: 300px; height: 200px;" />
`;
5. 注意事项和局限性
HTML 支持的范围: html-pptxgenjs 支持的 HTML 标签和样式有限，复杂的布局或高级的 CSS 特性可能不会完全正确地转换为 PPTX。
图片处理: 插入的图像需要是在线的 URL 或 Base64 编码的字符串。如果图片路径错误或无法访问，图片可能无法正确显示。
字体支持: 在 PowerPoint 中使用的字体需要在打开 PPTX 文件的系统上可用，否则可能会出现字体替换的问题。
6. 总结
html-pptxgenjs 是一个强大且实用的工具，适用于将现有的 HTML 内容快速转换为 PowerPoint 演示文稿。通过结合 PptxGenJS 的功能，它允许开发者在 Node.js 应用中轻松生成 PPTX 文件，并将其用于报告、演示或其他业务需求。尽管在处理复杂布局和样式时存在一些局限性，但对于大多数简单到中等复杂的文档生成任务，这个工具是一个很好的选择。

ExcelJS
ExcelJS 是一个强大的 Node.js 库，用于创建、读取和操作 Excel 文件（.xlsx 和 .csv 格式）。它可以生成复杂的电子表格、编辑现有文件、处理数据，并支持多种格式和样式，是构建与 Excel 相关功能的绝佳工具。

1. 安装
首先，在你的 Node.js 项目中安装 ExcelJS：

npm install exceljs
2. 基本用法
ExcelJS 提供了非常简单的 API 来创建和处理 Excel 工作簿和工作表。以下是创建和保存一个基本 Excel 文件的示例：

const ExcelJS = require('exceljs');

// 创建一个新的工作簿
const workbook = new ExcelJS.Workbook();

// 添加一个新的工作表
const worksheet = workbook.addWorksheet('My Sheet');

// 添加列
worksheet.columns = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'DOB', key: 'dob', width: 15 },
];

// 添加行
worksheet.addRow({ id: 1, name: 'John Doe', dob: new Date(1990, 1, 1) });
worksheet.addRow({ id: 2, name: 'Jane Doe', dob: new Date(1995, 5, 15) });

// 保存 Excel 文件
workbook.xlsx.writeFile('example.xlsx')
  .then(() => {
    console.log('Excel file saved!');
  });
3. 主要功能和用法
3.1. 工作簿和工作表
工作簿（Workbook）: Excel 文件由多个工作簿组成。一个工作簿可以包含多个工作表。

const workbook = new ExcelJS.Workbook();
工作表（Worksheet）: 每个工作簿可以包含一个或多个工作表，工作表用于存储表格数据。

const worksheet = workbook.addWorksheet('My Sheet');
3.2. 操作列和行
添加列: 使用 columns 属性定义工作表的列，可以设置列的标题、键值和宽度。

worksheet.columns = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'DOB', key: 'dob', width: 15 },
];
添加行: 使用 addRow 方法添加行数据，行数据可以是数组或对象。

worksheet.addRow({ id: 1, name: 'John Doe', dob: new Date(1990, 1, 1) });
多行添加: 可以通过 addRows 方法一次性添加多行。

worksheet.addRows([
  { id: 2, name: 'Jane Doe', dob: new Date(1995, 5, 15) },
  { id: 3, name: 'Chris Smith', dob: new Date(1988, 7, 24) },
]);
3.3. 单元格样式
设置字体: 可以为单元格设置字体样式，包括字体名称、大小、粗体、斜体等。

worksheet.getCell('A1').font = {
  name: 'Arial',
  family: 2,
  size: 14,
  bold: true,
};
设置边框: 可以为单元格设置边框样式。

worksheet.getCell('A1').border = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};
设置对齐方式: 可以为单元格设置对齐方式。

worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
设置背景颜色: 可以为单元格设置填充颜色。

worksheet.getCell('A1').fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFF0000' },
};
3.4. 合并单元格
你可以合并工作表中的单元格，创建一个跨越多个列或行的单元格区域。

worksheet.mergeCells('A1:C1');
worksheet.getCell('A1').value = 'Merged Cells';
3.5. 读取和修改现有的 Excel 文件
你可以使用 ExcelJS 读取现有的 Excel 文件，并对其内容进行修改。

const workbook = new ExcelJS.Workbook();
workbook.xlsx.readFile('example.xlsx')
  .then(() => {
    const worksheet = workbook.getWorksheet('My Sheet');
    worksheet.getCell('A1').value = 'New Value';
    return workbook.xlsx.writeFile('example-modified.xlsx');
  })
  .then(() => {
    console.log('Excel file modified and saved!');
  });
3.6. 处理 CSV 文件
ExcelJS 也支持创建和读取 CSV 文件。

生成 CSV 文件:

workbook.csv.writeFile('example.csv')
  .then(() => {
    console.log('CSV file saved!');
  });
读取 CSV 文件:

workbook.csv.readFile('example.csv')
  .then(() => {
    console.log('CSV file read successfully!');
  });
4. 常见应用场景
生成报表: 使用 ExcelJS 动态生成各种报表，如财务报告、统计数据报告等，并可以直接保存为 Excel 文件供用户下载。
数据导出: 从数据库或 API 获取数据并导出为 Excel 文件，便于用户分析和查看。
批量数据处理: 使用 ExcelJS 处理和分析大批量的 Excel 数据，适合在自动化任务或后台处理程序中使用。
5. 注意事项
性能考虑: 对于非常大的 Excel 文件，操作时可能会消耗较多内存和 CPU 资源。可以考虑分批处理数据或优化代码逻辑以提高性能。
Excel 版本兼容性: ExcelJS 生成的文件是基于开放的 .xlsx 标准格式的，通常可以在现代版本的 Microsoft Excel 以及其他支持 .xlsx 的软件中正常打开。
6. 总结
ExcelJS 是一个功能强大且灵活的工具，适用于各种 Excel 相关的应用场景，从简单的数据导出到复杂的报表生成和数据分析。通过合理使用 ExcelJS 的 API，你可以轻松地在 Node.js 应用中创建、编辑和处理 Excel 文件。

StreamableFile
StreamableFile 是 NestJS 中一个用于流式传输文件的工具类，特别适合处理需要直接向客户端传输文件内容的场景。它可以帮助你轻松地处理大文件或任何需要按块发送的数据流，以提高传输效率和节省内存。

1. 什么是 StreamableFile？
StreamableFile 是 NestJS 提供的一个实用工具，用于将文件内容以流的形式传输给客户端。与一次性将文件内容加载到内存中并发送给客户端不同，StreamableFile 允许你逐块发送文件数据，这对于大文件或实时生成的内容尤其有用。

2. 安装与配置
StreamableFile 是 NestJS 标准库的一部分，因此无需额外安装，直接引入并使用即可。

3. 基本用法
以下是如何在 NestJS 控制器中使用 StreamableFile 的一个基本示例：

import { Controller, Get, Res, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';

@Controller('files')
export class FilesController {
  @Get('download')
  downloadFile(@Res() res: Response): StreamableFile {
    // 创建一个可读流，指向要下载的文件
    const file = createReadStream(join(__dirname, '..', 'files', 'example.txt'));

    // 设置响应头，用于指示下载文件的名称
    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="example.txt"',
    });

    // 返回一个 StreamableFile 实例，用于流式传输文件
    return new StreamableFile(file);
  }
}
在这个示例中：

createReadStream: 使用 Node.js 内置的 fs 模块的 createReadStream 方法创建一个文件的可读流。
res.set(): 设置 HTTP 响应头，比如 Content-Type（文件类型）和 Content-Disposition（文件下载时的名称）。
StreamableFile: 将可读流传递给 StreamableFile，并返回给客户端。
当客户端发起请求时，文件内容将以流的形式发送给客户端，客户端可以开始下载文件，而不需要等待服务器加载整个文件。

4. 处理大文件
StreamableFile 特别适合处理大文件，因为它不会将整个文件加载到内存中，而是逐块读取文件并发送到客户端。这种方法节省了服务器内存，并提高了大文件传输的效率。

5. 传输动态生成的内容
除了文件，StreamableFile 也可以用于传输动态生成的内容，比如图像生成、报告生成等。你可以创建一个可读流，将动态生成的内容逐块传输给客户端。

import { Controller, Get, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';

@Controller('dynamic')
export class DynamicController {
  @Get('stream')
  streamData(): StreamableFile {
    const stream = new Readable({
      read() {
        this.push('Hello, this is dynamic content!\n');
        this.push(null); // 结束流
      }
    });

    return new StreamableFile(stream);
  }
}
在这个例子中，Readable 流被用于生成动态内容，然后通过 StreamableFile 发送给客户端。

6. 响应头设置
你可以通过 Response 对象设置各种 HTTP 头，以控制文件下载的行为，例如：

Content-Disposition: 控制文件名和下载行为（如附件下载）。
Content-Type: 设置文件的 MIME 类型，告诉浏览器如何处理文件内容。
Content-Length: 设置文件的大小（可选），有助于客户端显示进度条。
7. 与文件上传集成
StreamableFile 可以与文件上传功能集成。比如，在用户上传文件之后，你可以将文件流直接返回给客户端进行进一步处理。

import { Controller, Post, UploadedFile, UseInterceptors, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('upload')
export class UploadController {
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File): StreamableFile {
    const filePath = join(__dirname, '..', 'uploads', file.filename);
    const fileStream = createReadStream(filePath);
    return new StreamableFile(fileStream);
  }
}
8. 总结
StreamableFile 是一个非常有用的工具，适用于需要高效传输大文件或动态内容的场景。它通过流式传输数据，减少了内存占用并提高了传输效率。在处理文件下载、实时内容生成和大文件传输时，StreamableFile 可以让你的 NestJS 应用更加健壮和高效。

@nestjs/mongoose
@nestjs/mongoose 是一个用于将 MongoDB 数据库与 NestJS 框架集成的模块，它基于 Mongoose ODM（对象文档映射器）构建。Mongoose 提供了对 MongoDB 数据库的高级抽象，使得开发者可以使用面向对象的方式来操作数据库。@nestjs/mongoose 模块通过提供装饰器和注入机制，使得在 NestJS 应用中使用 Mongoose 更加便捷和模块化。

1. 安装
首先，你需要在 NestJS 项目中安装 @nestjs/mongoose 和 mongoose：

npm install @nestjs/mongoose mongoose
2. 基本配置
在使用 @nestjs/mongoose 模块之前，需要在应用程序中进行配置。通常是在 AppModule 中进行全局的数据库连接配置。

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // 使用 MongooseModule.forRoot 连接 MongoDB 数据库
    MongooseModule.forRoot('mongodb://localhost/nest'),
  ],
})
export class AppModule {}
MongooseModule.forRoot() 方法用于配置 MongoDB 连接字符串及其他选项。这里连接了本地运行的 MongoDB 实例。

3. 定义 Schema
在 Mongoose 中，Schema 是描述 MongoDB 文档结构的地方。@nestjs/mongoose 提供了 @Schema、@Prop 等装饰器，使得定义 Schema 更加简洁和类型安全。

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// 定义一个 Mongoose 文档类型的类
export type CatDocument = Cat & Document;

@Schema() // 使用 @Schema 装饰器将类标记为 Mongoose Schema
export class Cat {
  @Prop({ required: true }) // 使用 @Prop 装饰器定义属性并设置选项
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}

// 使用 SchemaFactory 生成 Mongoose Schema
export const CatSchema = SchemaFactory.createForClass(Cat);
4. 创建模型
一旦定义了 Schema，就可以创建模型。在 NestJS 中，通过使用 MongooseModule.forFeature() 方法将模型导入到模块中：

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cat, CatSchema } from './cat.schema';
import { CatsService } from './cats.service';
import { CatsController } from './cats.controller';

@Module({
  imports: [
    // 使用 MongooseModule.forFeature 注册模型
    MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
  ],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
在 forFeature() 方法中，将模型名称和对应的 Schema 注册到模块中。这个步骤确保了模型可以在模块内的服务或控制器中被注入和使用。

5. 使用模型
模型在服务中可以通过依赖注入的方式使用。模型对象通常用于执行数据库操作，如创建、查找、更新和删除文档。

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cat, CatDocument } from './cat.schema';

@Injectable()
export class CatsService {
  constructor(
    // 使用 InjectModel 装饰器注入 Cat 模型
    @InjectModel(Cat.name) private catModel: Model<CatDocument>,
  ) {}

  async create(createCatDto: { name: string; age: number; breed: string }): Promise<Cat> {
    // 创建一个新的 Cat 文档
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save(); // 保存文档到数据库
  }

  async findAll(): Promise<Cat[]> {
    // 查找所有 Cat 文档
    return this.catModel.find().exec();
  }
}
6. 常用功能
查询：使用 find、findById、findOne 等方法来查询数据库中的文档。
更新：使用 updateOne、updateMany、findByIdAndUpdate 等方法更新文档。
删除：使用 deleteOne、deleteMany、findByIdAndDelete 等方法删除文档。
钩子函数：Mongoose 提供了各种钩子（如 pre、post）来在保存、更新、删除操作之前或之后执行特定逻辑。
7. 高级用法
中间件：可以使用 Mongoose 中间件来处理复杂的逻辑，如在保存之前对数据进行验证或处理。
索引：使用 Mongoose 的索引功能来提高查询效率。
验证：通过 Schema 的验证器确保数据的完整性和一致性。
8. 事务管理
Mongoose 支持 MongoDB 4.0+ 的事务，可以确保一组操作的原子性。NestJS 中，可以通过 @Transaction 装饰器或手动管理 session 来实现事务。

const session = await this.catModel.startSession();
session.startTransaction();
try {
  // 执行多步数据库操作
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
} finally {
  session.endSession();
}
总结
@nestjs/mongoose 是一个强大的工具，简化了 NestJS 应用程序中使用 MongoDB 的开发过程。它结合了 Mongoose 的灵活性和 NestJS 的模块化设计，使得开发者能够以类型安全、可维护的方式构建复杂的数据库交互逻辑。

geoip-lite
geoip-lite 是一个轻量级的 Node.js 库，用于根据 IP 地址获取地理位置信息。它无需依赖外部服务，使用本地的 GeoLite2 数据库进行 IP 地址的地理位置解析。geoip-lite 特别适合需要快速查找 IP 地址相关的国家、城市信息的场景，尤其是在对性能和响应时间有要求的应用中。

1. 安装
首先，你需要在 Node.js 项目中安装 geoip-lite：

npm install geoip-lite
2. 基本用法
geoip-lite 的使用非常简单，你只需引入库并调用它提供的方法来查找 IP 地址的地理位置。

const geoip = require('geoip-lite');

// 示例 IP 地址
const ip = '207.97.227.239';

// 获取地理位置信息
const geo = geoip.lookup(ip);

console.log(geo);
3. 输出结果
上面的代码会输出一个包含地理位置信息的对象，通常包括以下几个字段：

range: 包含起始和结束的 IP 地址范围，以数字形式表示。
country: IP 地址对应的国家代码，符合 ISO 3166-1 标准。
region: IP 地址对应的区域代码，一般为省或州的代码。
city: IP 地址对应的城市名称。
ll: 包含纬度和经度的数组。
metro: 对应于美国的地铁代码（部分地区会有）。
{
  range: [3479299040, 3479299071],
  country: 'US',
  region: 'TX',
  city: 'San Antonio',
  ll: [29.4997, -98.3992],
  metro: 641
}
4. API 详解
geoip-lite 提供的核心功能是通过 IP 地址查找地理位置信息，以下是主要的方法和用法：

4.1. lookup(ip)
这是 geoip-lite 的主要方法，用于根据传入的 IP 地址查找其地理位置信息。

参数:
ip (string): 需要查找的 IP 地址，可以是 IPv4 或 IPv6 地址。
返回值:
如果查找到对应的地理信息，则返回一个包含上述字段的对象；如果未找到，则返回 null。
const geo = geoip.lookup('8.8.8.8');
console.log(geo);
4.2. 支持 IPv4 和 IPv6
geoip-lite 支持查询 IPv4 和 IPv6 地址，不过它对 IPv6 的支持较为有限，具体精度取决于数据库。

const ipv6Geo = geoip.lookup('2607:f0d0:1002:51::4');
console.log(ipv6Geo);
5. 本地数据库
geoip-lite 使用的是 MaxMind 提供的 GeoLite2 数据库。每当你安装或更新 geoip-lite 时，库会自动下载最新版本的 GeoLite2 数据库并将其存储在本地。这意味着查询时不需要网络请求，能够非常快速地返回结果。

6. 更新数据库
由于 geoip-lite 的数据库是本地存储的，因此需要定期更新以确保地理位置信息的准确性。你可以通过以下方式更新数据库：

手动更新: 你可以通过以下命令更新数据库：

npm run-script updatedb
这会自动从 MaxMind 获取最新的 GeoLite2 数据库并替换本地旧版本。

自动更新: 你也可以在应用中集成自动更新逻辑，定期检查并更新数据库。

7. 注意事项
精度限制: geoip-lite 使用的 GeoLite2 数据库并非实时更新，因此可能无法提供最新的地理位置映射结果。对于一些具体地址或小型区域的解析精度可能会有所欠缺。
合规性: GeoLite2 数据库是免费的，但受 MaxMind 的使用条款约束。如果你需要更高精度和实时更新的地理位置数据，可以考虑使用 MaxMind 的付费 GeoIP 数据库。
隐私问题: 在使用 IP 地址获取地理位置信息时，请确保遵守隐私法规和政策，特别是在处理用户敏感数据时。
8. 示例场景
geoip-lite 适用于多种场景，如：

访问控制: 根据访问者的地理位置限制或允许访问某些内容。
内容定制: 根据用户的地理位置定制网站内容或广告。
数据分析: 对访问日志进行地理位置分析，以了解用户分布和访问模式。
9. 总结
geoip-lite 是一个简单、快速的库，适用于在 Node.js 环境中进行 IP 地址的地理位置解析。它的轻量级特性和本地数据库的使用使得查询速度非常快，适合需要快速响应的应用场景。虽然精度有限，但对于大多数常见应用场景来说，geoip-lite 提供了足够的地理位置信息支持。如果你的应用需要基于 IP 的地理位置分析，geoip-lite 是一个很好的选择。

ECharts
ECharts 是一个由百度开源的强大、灵活、易用的数据可视化库。它支持各种常见的图表类型，如折线图、柱状图、饼图、散点图、K线图、雷达图等，并且能够处理大规模数据集，提供丰富的交互性和高度的自定义能力。

ECharts 可以在浏览器中渲染图表，支持基于 Canvas 和 SVG 的渲染方式，具有较高的渲染性能，尤其在处理大数据量和复杂图表时表现出色。

1. 安装
ECharts 可以通过多种方式使用，如直接引用 CDN、通过 npm 安装等：

使用 CDN:

<script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
通过 npm 安装:

npm install echarts --save
2. 基本用法
在使用 ECharts 时，通常需要以下几个步骤：

引入 ECharts: 在 HTML 中通过 <script> 标签引入 ECharts。
准备一个 DOM 容器: 图表需要在一个特定的 DOM 元素中进行渲染，通常是一个 div 标签。
初始化图表: 使用 ECharts 的 echarts.init() 方法初始化图表。
设置图表配置项（option）: 使用配置项来定义图表的类型、数据和样式。
渲染图表: 使用 setOption() 方法将配置项应用到图表实例上。
以下是一个基本的 ECharts 使用示例：

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ECharts Example</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
</head>
<body>
    <!-- 准备一个 DOM 容器 -->
    <div id="main" style="width: 600px;height:400px;"></div>

    <script type="text/javascript">
        // 初始化图表实例
        var myChart = echarts.init(document.getElementById('main'));

        // 指定图表的配置项和数据
        var option = {
            title: {
                text: 'ECharts 入门示例'
            },
            tooltip: {},
            legend: {
                data:['销量']
            },
            xAxis: {
                data: ["衬衫","羊毛衫","雪纺衫","裤子","高跟鞋","袜子"]
            },
            yAxis: {},
            series: [{
                name: '销量',
                type: 'bar', // 指定图表类型为柱状图
                data: [5, 20, 36, 10, 10, 20]
            }]
        };

        // 使用配置项和数据生成图表
        myChart.setOption(option);
    </script>
</body>
</html>
3. 核心概念和组件
3.1. 配置项（option）
option 是 ECharts 中最重要的配置对象，用于定义图表的所有属性，包括图表类型、数据、标题、坐标轴、图例等。option 对象的主要属性包括：

title: 定义图表的标题。
tooltip: 配置提示框，展示数据的具体信息。
legend: 配置图例，用于标识不同系列的数据。
xAxis: 定义 X 轴的属性。
yAxis: 定义 Y 轴的属性。
series: 定义具体的数据和图表类型，series 可以是一个数组，表示可以在同一个图表中展示多个系列的数据。
3.2. 常见图表类型
ECharts 支持多种图表类型，每种图表类型都有相应的 type 和对应的数据格式。

折线图 (line): 用于显示随时间或分类变化的趋势。
柱状图 (bar): 用于比较不同分类的数据大小。
饼图 (pie): 用于展示数据在整体中的占比。
散点图 (scatter): 用于展示两个变量之间的关系。
雷达图 (radar): 用于展示多维数据。
示例：折线图

var lineOption = {
    title: {
        text: '销售趋势'
    },
    tooltip: {
        trigger: 'axis'
    },
    xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
        type: 'value'
    },
    series: [{
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'line'
    }]
};

myChart.setOption(lineOption);
3.3. 数据
ECharts 的数据可以直接在 option 中定义，或通过 AJAX 等方式动态加载。数据的格式根据图表类型不同而有所变化。例如，柱状图和折线图的数据通常是数组形式，而饼图的数据则是对象数组。

// 柱状图数据
series: [{
    name: '销量',
    type: 'bar',
    data: [5, 20, 36, 10, 10, 20]
}]

// 饼图数据
series: [{
    name: '访问来源',
    type: 'pie',
    radius: '55%',
    data: [
        {value: 335, name: '直接访问'},
        {value: 310, name: '邮件营销'},
        {value: 234, name: '联盟广告'},
        {value: 135, name: '视频广告'},
        {value: 1548, name: '搜索引擎'}
    ]
}]
4. 高级功能
4.1. 动态更新数据
ECharts 支持通过 setOption 动态更新数据，而不需要重新创建图表实例。这对于实时数据更新非常有用。

myChart.setOption({
    series: [{
        data: [10, 15, 20, 25, 30]
    }]
});
4.2. 响应式设计
ECharts 图表会自动适应容器的大小变化。当浏览器窗口大小改变时，图表也会相应调整。可以使用 resize 方法手动触发图表的重新调整。

window.onresize = function() {
    myChart.resize();
};
4.3. 事件处理
ECharts 提供了丰富的事件机制，可以对图表中的点击、悬停等交互进行响应。

myChart.on('click', function (params) {
    console.log(params.name + ' clicked!');
});
5. 集成与扩展
ECharts 可以集成到多种框架和库中，如 React、Vue、Angular 等，并且可以通过插件系统进行扩展。你可以通过扩展图表类型、定制数据处理等方式来满足特定的需求。

6. 总结
ECharts 是一个功能丰富、性能优秀的数据可视化库，适用于多种场景，包括实时数据展示、业务数据报表、大数据分析等。通过灵活的配置和强大的扩展能力，ECharts 能够满足从简单到复杂的各种数据可视化需求。无论是在 Web 项目还是在跨平台应用中，ECharts 都是一个可靠的选择。

Handlebars
Handlebars 是一种流行的模板引擎，用于生成 HTML 页面。它与 JavaScript 搭配使用，通过模板和数据来动态生成网页内容。以下是对 Handlebars 的一些关键概念和用法的讲解：

1. 基本语法
Handlebars 的基本语法非常简单，使用 {{}} 作为占位符来插入变量。例如，如果有一个变量 name，在模板中可以这样写：

<p>Hello, {{name}}!</p>
当 name 的值为 "John" 时，生成的 HTML 会是：

<p>Hello, John!</p>
2. 条件语句
Handlebars 支持条件语句，通常使用 {{#if}} 和 {{else}} 来实现。例如：

{{#if isAdmin}}
  <p>Welcome, Admin!</p>
{{else}}
  <p>Welcome, User!</p>
{{/if}}
根据 isAdmin 的值，模板会生成不同的内容。

3. 循环语句
如果要渲染一个列表，可以使用 {{#each}} 语句。例如：

<ul>
  {{#each items}}
    <li>{{this}}</li>
  {{/each}}
</ul>
假设 items 是一个数组 [ "Item 1", "Item 2", "Item 3" ]，生成的 HTML 将是：

<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
4. 模板编译与渲染
要使用 Handlebars，需要首先编译模板，然后与数据进行绑定来生成最终的 HTML。以下是一个基本的例子：

// 获取模板字符串
var source = "<p>Hello, {{name}}!</p>";

// 编译模板
var template = Handlebars.compile(source);

// 准备数据
var context = { name: "John" };

// 渲染模板并生成 HTML
var html = template(context);

console.log(html); // 输出: <p>Hello, John!</p>
5. 自定义 Helper
Handlebars 允许定义自定义 Helper 来扩展模板功能。例如，可以定义一个简单的 Helper 来格式化日期：

Handlebars.registerHelper('formatDate', function(dateString) {
  var date = new Date(dateString);
  return date.toDateString();
});

// 在模板中使用
var source = "<p>Today's date is {{formatDate date}}.</p>";
var template = Handlebars.compile(source);
var context = { date: "2024-08-31" };
var html = template(context);

console.log(html); // 输出: <p>Today's date is Sat Aug 31 2024.</p>
6. 部分模板（Partials）
Handlebars 还支持“部分模板”（partials），这对于重用模板片段非常有用。可以这样定义一个 partial：

<!-- 定义部分模板 -->
{{> header }}

<!-- 使用部分模板 -->
<p>Content goes here...</p>

<!-- 定义部分模板内容 -->
<script id="header-template" type="text/x-handlebars-template">
  <header>
    <h1>{{title}}</h1>
  </header>
</script>
注册和使用部分模板的方法：

Handlebars.registerPartial('header', document.getElementById('header-template').innerHTML);
var template = Handlebars.compile(document.getElementById('main-template').innerHTML);
var context = { title: "My Website" };
var html = template(context);

console.log(html); // 生成包含部分模板的完整HTML
7. 安全性
Handlebars 会自动对插入的内容进行 HTML 转义，以防止 XSS（跨站脚本）攻击。如果需要插入未转义的 HTML，可以使用 {{{}}}。例如：

<p>{{{rawHtml}}}</p>
但要小心使用，以确保数据来源是安全的。

总结
Handlebars 是一个功能强大且灵活的模板引擎，适用于静态网站生成器、单页应用程序（SPA）等场景。它通过简单的语法和强大的扩展能力，使得动态生成 HTML 变得更加高效。

@Sse
@Sse 是 NestJS 中用于处理服务器发送事件（Server-Sent Events, SSE）的装饰器。SSE 是一种允许服务器主动向客户端发送更新的技术，通常用于实时更新数据的场景，例如动态仪表盘、实时通知等。

1. 什么是 SSE？
SSE 是一种从服务器向客户端单向推送数据的协议。与 WebSocket 不同，SSE 是通过 HTTP 协议实现的，且是单向通信——服务器可以主动向客户端推送数据，但客户端不能向服务器发送数据。

在客户端，使用 EventSource 对象可以方便地接收来自服务器的事件流。

2. @Sse 的使用
在 NestJS 中，可以使用 @Sse() 装饰器来创建一个 SSE 端点。这个端点会持续不断地向连接的客户端推送数据流。

以下是一个基本的例子，展示了如何在 NestJS 中使用 @Sse 装饰器：

import { Controller, Sse } from '@nestjs/common';
import { interval, map } from 'rxjs';

@Controller('events')
export class EventsController {
  // 定义一个 SSE 端点，返回的是一个 Observable 或者 AsyncIterable
  @Sse('systemInfo')
  sendSystemInfo() {
    // 每隔一秒发送一条消息
    return interval(1000).pipe(
      // map 函数将数字映射为 SSE 消息格式
      map(() => ({ data: { timestamp: new Date().toISOString() } })),
    );
  }
}
3. 工作原理
定义端点：在上面的例子中，@Sse('systemInfo') 定义了一个路径为 /events/systemInfo 的 SSE 端点。
返回数据流：sendSystemInfo 方法返回的是一个 Observable，这个 Observable 会不断地发送数据流。每发送一次数据，客户端就会接收到一次消息。
数据格式：发送的数据应该遵循 SSE 的格式。典型的格式包括 data 字段，这是传递给客户端的实际数据。
4. 客户端如何接收数据
客户端可以通过 EventSource 对象连接到这个 SSE 端点，并接收服务器推送的数据：

const eventSource = new EventSource('/events/systemInfo');

eventSource.onmessage = function(event) {
  console.log('Received data:', event.data);
};
在这个例子中，客户端每秒会接收到一次服务器推送的时间戳数据。

5. 错误处理
如果 SSE 连接出现问题，可以在客户端设置 onerror 处理函数来处理连接错误：

eventSource.onerror = function(event) {
  console.error('SSE connection error:', event);
};
总结
@Sse 是一个用于在 NestJS 中创建 SSE 端点的装饰器。
SSE 适用于需要从服务器向客户端推送实时数据的场景。
使用 @Sse 端点时，返回的应该是一个数据流（如 Observable），服务器会持续推送数据给客户端。
这种机制非常适合构建实时应用，如监控系统、通知系统等。

systeminformation
systeminformation 是一个用于 Node.js 应用程序的强大库，用于获取有关系统硬件和操作系统的详细信息。它提供了关于 CPU、内存、磁盘、网络、操作系统、进程等各种系统信息的简便接口，非常适合用于系统监控、诊断工具或需要获取系统状态的应用程序。

1. 安装
在你的 Node.js 项目中安装 systeminformation：

npm install systeminformation
2. 基本用法
使用 systeminformation 库非常简单。你可以导入库并调用各种方法来获取系统的不同方面的信息。以下是一个基本示例：

const si = require('systeminformation');

// 获取 CPU 信息
si.cpu()
  .then(data => console.log(data))
  .catch(error => console.error(error));

// 获取内存信息
si.mem()
  .then(data => console.log(data))
  .catch(error => console.error(error));
3. 核心功能与方法
systeminformation 提供了很多功能模块，每个模块包含多个方法，用于获取特定类别的信息。

3.1. CPU 信息
cpu() 方法返回有关系统 CPU 的详细信息。

si.cpu().then(data => {
  console.log('CPU 信息:', data);
  /*
  输出示例：
  {
    manufacturer: 'Intel®',
    brand: 'Core™ i7-7700HQ',
    speed: '2.80',
    speedmin: '0.80',
    speedmax: '3.80',
    cores: 4,
    physicalCores: 4,
    processors: 1,
    socket: 'U3E1'
  }
  */
});
3.2. 内存信息
mem() 方法返回当前系统的内存使用情况。

si.mem().then(data => {
  console.log('内存信息:', data);
  /*
  输出示例：
  {
    total: 17179869184,      // 总内存 (字节)
    free: 8468125696,        // 空闲内存 (字节)
    used: 8711743488,        // 已用内存 (字节)
    active: 5674885120,
    available: 13611868160,
    buffers: 27500544,
    cached: 7648133120,
    slab: 383614976
  }
  */
});
3.3. 磁盘信息
diskLayout() 方法返回系统磁盘的物理布局信息。

si.diskLayout().then(data => {
  console.log('磁盘布局:', data);
  /*
  输出示例：
  [
    {
      device: '/dev/sda',
      type: 'SSD',
      name: 'Samsung SSD 850 EVO 500GB',
      vendor: 'Samsung',
      size: 500107862016,
      bytesPerSector: 512,
      totalCylinders: 60801,
      totalHeads: 255,
      totalSectors: 976768065,
      totalTracks: 15504255,
      tracksPerCylinder: 255,
      sectorsPerTrack: 63,
      firmwareRevision: 'EMT02B6Q',
      serialNum: 'S21JNSAG411234H',
      interfaceType: 'SATA'
    }
  ]
  */
});
3.4. 网络信息
networkInterfaces() 方法返回系统所有网络接口的详细信息。

si.networkInterfaces().then(data => {
  console.log('网络接口:', data);
  /*
  输出示例：
  [
    {
      iface: 'eth0',
      ip4: '192.168.1.100',
      ip6: 'fe80::a00:27ff:fe4e:66a1',
      mac: '08:00:27:4e:66:a1',
      internal: false
    }
  ]
  */
});
3.5. 操作系统信息
osInfo() 方法返回当前操作系统的详细信息。

si.osInfo().then(data => {
  console.log('操作系统信息:', data);
  /*
  输出示例：
  {
    platform: 'linux',
    distro: 'Ubuntu',
    release: '20.04',
    codename: 'focal',
    kernel: '5.4.0-42-generic',
    arch: 'x64',
    hostname: 'ubuntu-server',
    codepage: 'UTF-8',
    logofile: 'ubuntu',
    serial: '1234-5678-9101',
    build: 'LTS'
  }
  */
});
3.6. 进程信息
processes() 方法返回系统当前正在运行的所有进程的详细信息。

si.processes().then(data => {
  console.log('进程信息:', data);
  /*
  输出示例：
  {
    all: 354,
    running: 1,
    blocked: 0,
    sleeping: 353,
    list: [
      {
        pid: 1,
        parentPid: 0,
        name: 'systemd',
        pcpu: 0.5,
        pmem: 0.1,
        priority: 20,
        started: '2021-10-28 17:12:43',
        state: 'sleeping',
        tty: '?',
        user: 'root',
        command: '/lib/systemd/systemd --system --deserialize 19'
      }
    ]
  }
  */
});
4. 实时监控
systeminformation 提供了一些方法可以用于实时监控，例如监控 CPU 负载、内存使用率、网络流量等。以下是一个实时获取 CPU 温度的示例：

setInterval(() => {
  si.cpuTemperature().then(data => {
    console.log('CPU 温度:', data.main + '°C');
  });
}, 1000);
5. 组合使用
你可以组合使用 systeminformation 提供的各种方法，来获取系统的整体健康状态或执行复杂的系统监控任务。

Promise.all([si.cpu(), si.mem(), si.osInfo()]).then(values => {
  const [cpu, mem, os] = values;
  console.log('CPU 信息:', cpu);
  console.log('内存信息:', mem);
  console.log('操作系统信息:', os);
});
6. 注意事项
权限问题: 某些信息（例如硬件传感器数据或进程信息）可能需要管理员权限才能访问。
跨平台支持: systeminformation 支持多种操作系统，包括 Windows、Linux 和 macOS，不过某些功能在特定平台上可能无法使用或输出不同的结果。
7. 总结
systeminformation 是一个强大的库，用于获取系统的各种硬件和操作系统信息。它适用于多种场景，如系统监控、性能分析、运维工具开发等。通过简单的 API 调用，你可以轻松获取从 CPU 和内存到网络和进程的各种详细信息，这使得 systeminformation 成为 Node.js 环境下处理系统信息的首选工具。

ioredis
ioredis 是一个强大的 Redis 客户端库，专为 Node.js 设计，用于与 Redis 数据库进行交互。它支持 Redis 的所有命令，并且具有一些高级特性，如连接池、自动重连、事件监听和集群模式支持。以下是对 ioredis 的详细讲解：

1. 安装 ioredis
首先，你需要在项目中安装 ioredis 包：

npm install ioredis
2. 基本用法
ioredis 的基本用法非常简单，以下是一个与 Redis 交互的示例：

const Redis = require('ioredis');

// 创建一个 Redis 客户端实例
const redis = new Redis();

// 设置一个键值对
redis.set('foo', 'bar');

// 获取键值
redis.get('foo', (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Value:', result); // 输出 'bar'
  }
});

// 关闭连接
redis.quit();
3. 连接 Redis
ioredis 默认连接到 localhost 上的 Redis 实例。你可以通过传递一个连接字符串或配置对象来指定其他连接信息：

// 使用连接字符串
const redis = new Redis('redis://:password@127.0.0.1:6380/4');

// 或使用配置对象
const redis = new Redis({
  port: 6379,          // Redis 端口
  host: '127.0.0.1',   // Redis 主机
  family: 4,           // 4 (IPv4) 或 6 (IPv6)
  password: 'password',
  db: 0                // 使用的数据库编号
});
4. 常用操作
ioredis 支持 Redis 的所有命令，以下是一些常见的操作：

设置键值对：set 命令

redis.set('key', 'value');
获取键的值：get 命令

redis.get('key').then((result) => {
  console.log(result);
});
删除键：del 命令

redis.del('key');
增量操作：incr 和 decr 命令

redis.incr('counter');
redis.decr('counter');
使用哈希表：

redis.hset('hash', 'field', 'value');
redis.hget('hash', 'field').then(console.log);
5. 订阅/发布（Pub/Sub）
ioredis 支持 Redis 的订阅/发布模式，这在构建实时应用时非常有用。

const Redis = require('ioredis');
const pub = new Redis();
const sub = new Redis();

// 订阅频道
sub.subscribe('news', 'music', (err, count) => {
  // 当接收到消息时触发
  sub.on('message', (channel, message) => {
    console.log(`Received message from ${channel}: ${message}`);
  });
});

// 发布消息
pub.publish('news', 'Hello World');
6. Redis 集群支持
ioredis 支持 Redis 集群模式，你可以轻松地连接到一个 Redis 集群：

const Redis = require('ioredis');

// 连接到 Redis 集群
const cluster = new Redis.Cluster([
  {
    port: 6380,
    host: '127.0.0.1'
  },
  {
    port: 6381,
    host: '127.0.0.1'
  }
]);

cluster.set('key', 'value');
cluster.get('key').then(console.log);
7. 高级特性
自动重连：ioredis 默认会自动重连，如果连接意外断开，它会尝试重新连接。

事件监听：你可以监听客户端的各种事件，如连接、断开、错误等。

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});
Lua 脚本：ioredis 允许你轻松执行 Lua 脚本。

redis.defineCommand('myScript', {
  numberOfKeys: 2,
  lua: `return redis.call('set', KEYS[1], ARGV[1])`
});

redis.myScript('key1', 'key2', 'value').then(console.log);
8. 性能优化
ioredis 提供了一些选项来优化性能，如批处理命令、管道和事务支持。管道可以让你一次性发送多个命令，从而减少网络延迟。

redis.pipeline()
  .set('foo', 'bar')
  .get('foo')
  .exec((err, results) => {
    console.log(results);
  });
总结
ioredis 是一个功能强大的 Redis 客户端，支持多种高级特性，适合在 Node.js 应用中使用。无论你是处理简单的键值存储，还是构建复杂的分布式系统，ioredis 都能提供强大的支持。

connect-redis
connect-redis 是一个用于将 Redis 作为会话存储的中间件，通常与 Express.js 或其他基于 Connect 的框架结合使用。它为会话管理提供了一种高效、持久的存储解决方案，特别适用于需要处理大量会话数据的分布式应用程序。

1. 安装
要使用 connect-redis，首先需要安装它以及 express-session 和 ioredis：

npm install connect-redis express-session ioredis
express-session：用于管理 Express 应用中的会话。
ioredis：Redis 客户端，用于与 Redis 数据库交互。
connect-redis：将 Redis 集成到 Express 的会话管理中。
2. 基本用法
以下是如何在 Express.js 应用中配置 connect-redis 作为会话存储的一个基本示例：

const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session); // 将 connect-redis 与 express-session 关联
const Redis = require('ioredis');

// 创建一个 Redis 客户端实例
const redisClient = new Redis();

const app = express();

// 配置会话中间件
app.use(session({
  store: new RedisStore({ client: redisClient }), // 使用 Redis 作为会话存储
  secret: 'your-secret-key', // 用于签署会话 ID 的密钥
  resave: false,             // 如果会话没有变化，则不强制保存
  saveUninitialized: false,  // 防止未修改的会话存储到 Redis
  cookie: {
    secure: false,           // 在 HTTP 环境中设置为 false，HTTPS 环境中建议设置为 true
    maxAge: 60000            // 会话过期时间，单位为毫秒
  }
}));

app.get('/', (req, res) => {
  // 在会话中存储数据
  req.session.views = (req.session.views || 0) + 1;
  res.send(`You have visited this page ${req.session.views} times`);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
3. 配置选项
connect-redis 的配置选项主要通过 RedisStore 提供，可以根据需要进行调整：

client：Redis 客户端实例，通常使用 ioredis 或 redis 模块创建。
host、port：Redis 服务器的主机和端口，若不指定将使用默认的 localhost:6379。
ttl：会话的过期时间，以秒为单位。如果未设置，将使用 express-session 的 cookie.maxAge。
logErrors：是否记录 Redis 相关的错误信息，默认为 false，可以传入 true 或自定义的日志记录函数。
4. 集群支持
如果使用 Redis 集群，可以通过配置 ioredis 的 Cluster 模式，将 Redis 集群用作会话存储：

const Redis = require('ioredis');
const RedisStore = require('connect-redis')(session);

// 配置 Redis 集群
const cluster = new Redis.Cluster([
  { host: '127.0.0.1', port: 6380 },
  { host: '127.0.0.1', port: 6381 },
]);

app.use(session({
  store: new RedisStore({ client: cluster }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 60000
  }
}));
5. 持久化会话
通过使用 connect-redis，会话数据可以持久化存储在 Redis 中，即使服务器重启或发生故障，用户的会话状态也不会丢失。这对需要处理大量并发请求的应用程序非常重要。

6. 会话共享
在分布式系统中，可以使用多个应用实例，并通过共享的 Redis 实例来管理会话。这使得用户的会话可以在不同的服务器之间共享，实现无状态的应用架构。

7. 性能优化
连接池：ioredis 默认使用连接池，可以通过配置 Redis 客户端来优化性能。
Redis 持久化：确保 Redis 配置了合适的持久化策略（如 RDB、AOF），以防止数据丢失。
高可用性：通过 Redis Sentinel 或 Redis Cluster 提供高可用性，防止单点故障。
总结
connect-redis 是 Express.js 中处理会话管理的强大工具，尤其适用于需要高性能和高可用性的应用程序。通过与 Redis 集成，它能够有效地管理大量的会话数据，支持持久化和会话共享，确保应用在高负载环境下依然能够稳定运行。