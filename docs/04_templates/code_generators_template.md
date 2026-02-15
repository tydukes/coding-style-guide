---
title: "Code Generator Templates"
description: "Production-ready templates for Plop, Copier, and Yeoman code generators"
author: "Tyler Dukes"
tags: [code-generation, plop, copier, yeoman, scaffolding, automation]
category: "Templates"
status: "active"
search_keywords: [code generators, scaffolding, boilerplate, cookiecutter, yeoman, template]
---
<!-- markdownlint-disable MD013 MD024 -->

## Overview

This document provides comprehensive templates for code generation tools including Plop, Copier,
and Yeoman. These generators enable consistent code scaffolding across projects, reducing
boilerplate and enforcing best practices.

---

## Plop Generator Templates

Plop is a micro-generator framework that makes it easy to create files with a consistent structure.

### Project Setup

```javascript
// plopfile.js
module.exports = function (plop) {
  // Load all generators
  plop.load('./plop/generators/component.js');
  plop.load('./plop/generators/api-endpoint.js');
  plop.load('./plop/generators/database-migration.js');
  plop.load('./plop/generators/test.js');
  plop.load('./plop/generators/hook.js');
  plop.load('./plop/generators/service.js');

  // Custom helpers
  plop.setHelper('upperCase', (text) => text.toUpperCase());
  plop.setHelper('lowerCase', (text) => text.toLowerCase());
  plop.setHelper('camelCase', (text) => plop.getHelper('camelCase')(text));
  plop.setHelper('pascalCase', (text) => plop.getHelper('pascalCase')(text));
  plop.setHelper('kebabCase', (text) => plop.getHelper('kebabCase')(text));
  plop.setHelper('snakeCase', (text) => plop.getHelper('snakeCase')(text));

  // Date helpers
  plop.setHelper('currentDate', () => new Date().toISOString().split('T')[0]);
  plop.setHelper('currentYear', () => new Date().getFullYear().toString());

  // Conditional helper
  plop.setHelper('ifEquals', function (arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });
};
```

### React Component Generator

```javascript
// plop/generators/component.js
module.exports = function (plop) {
  plop.setGenerator('component', {
    description: 'Create a React component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name:',
        validate: (value) => {
          if (!value) return 'Component name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Component name must be PascalCase';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'type',
        message: 'Component type:',
        choices: [
          { name: 'Functional Component', value: 'functional' },
          { name: 'Page Component', value: 'page' },
          { name: 'Layout Component', value: 'layout' },
          { name: 'UI Component', value: 'ui' },
        ],
        default: 'functional',
      },
      {
        type: 'confirm',
        name: 'hasTests',
        message: 'Include tests?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'hasStyles',
        message: 'Include styles (CSS module)?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'hasStorybook',
        message: 'Include Storybook story?',
        default: true,
      },
    ],
    actions: (data) => {
      const basePath = data.type === 'page'
        ? 'src/pages/{{pascalCase name}}'
        : data.type === 'layout'
          ? 'src/layouts/{{pascalCase name}}'
          : data.type === 'ui'
            ? 'src/components/ui/{{pascalCase name}}'
            : 'src/components/{{pascalCase name}}';

      const actions = [
        {
          type: 'add',
          path: `${basePath}/{{pascalCase name}}.tsx`,
          templateFile: 'plop/templates/component/component.tsx.hbs',
        },
        {
          type: 'add',
          path: `${basePath}/index.ts`,
          templateFile: 'plop/templates/component/index.ts.hbs',
        },
      ];

      if (data.hasStyles) {
        actions.push({
          type: 'add',
          path: `${basePath}/{{pascalCase name}}.module.css`,
          templateFile: 'plop/templates/component/styles.module.css.hbs',
        });
      }

      if (data.hasTests) {
        actions.push({
          type: 'add',
          path: `${basePath}/{{pascalCase name}}.test.tsx`,
          templateFile: 'plop/templates/component/component.test.tsx.hbs',
        });
      }

      if (data.hasStorybook) {
        actions.push({
          type: 'add',
          path: `${basePath}/{{pascalCase name}}.stories.tsx`,
          templateFile: 'plop/templates/component/component.stories.tsx.hbs',
        });
      }

      return actions;
    },
  });
};
```

### Component Templates

```handlebars
{{!-- plop/templates/component/component.tsx.hbs --}}
import React from 'react';
{{#if hasStyles}}
import styles from './{{pascalCase name}}.module.css';
{{/if}}

export interface {{pascalCase name}}Props {
  /** Optional className for styling */
  className?: string;
  /** Content to render */
  children?: React.ReactNode;
}

/**
 * {{pascalCase name}} component
 *
 * @example
 * ```tsx
 * <{{pascalCase name}}>
 *   Content here
 * </{{pascalCase name}}>
 * ```
 */
export const {{pascalCase name}}: React.FC<{{pascalCase name}}Props> = ({
  className,
  children,
}) => {
  return (
    <div
      className={`{{#if hasStyles}}${styles.container}{{/if}}${className ? ` ${className}` : ''}`}
      data-testid="{{kebabCase name}}"
    >
      {children}
    </div>
  );
};

{{pascalCase name}}.displayName = '{{pascalCase name}}';
```

```handlebars
{{!-- plop/templates/component/component.test.tsx.hbs --}}
import { render, screen } from '@testing-library/react';
import { {{pascalCase name}} } from './{{pascalCase name}}';

describe('{{pascalCase name}}', () => {
  it('renders without crashing', () => {
    render(<{{pascalCase name}} />);
    expect(screen.getByTestId('{{kebabCase name}}')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(<{{pascalCase name}}>Test content</{{pascalCase name}}>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<{{pascalCase name}} className="custom-class" />);
    expect(screen.getByTestId('{{kebabCase name}}')).toHaveClass('custom-class');
  });
});
```

```handlebars
{{!-- plop/templates/component/component.stories.tsx.hbs --}}
import type { Meta, StoryObj } from '@storybook/react';
import { {{pascalCase name}} } from './{{pascalCase name}}';

const meta: Meta<typeof {{pascalCase name}}> = {
  title: 'Components/{{pascalCase name}}',
  component: {{pascalCase name}},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class',
    },
  },
};

export default meta;
type Story = StoryObj<typeof {{pascalCase name}}>;

export const Default: Story = {
  args: {
    children: 'Default content',
  },
};

export const WithCustomClass: Story = {
  args: {
    children: 'Custom styled content',
    className: 'custom-class',
  },
};
```

```handlebars
{{!-- plop/templates/component/styles.module.css.hbs --}}
.container {
  /* Base styles */
}
```

```handlebars
{{!-- plop/templates/component/index.ts.hbs --}}
export { {{pascalCase name}} } from './{{pascalCase name}}';
export type { {{pascalCase name}}Props } from './{{pascalCase name}}';
```

### API Endpoint Generator

```javascript
// plop/generators/api-endpoint.js
module.exports = function (plop) {
  plop.setGenerator('api-endpoint', {
    description: 'Create an API endpoint',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Endpoint name (e.g., users, products):',
        validate: (value) => {
          if (!value) return 'Endpoint name is required';
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'Endpoint name must be lowercase with hyphens';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'framework',
        message: 'API framework:',
        choices: [
          { name: 'Express.js', value: 'express' },
          { name: 'Fastify', value: 'fastify' },
          { name: 'Next.js API Routes', value: 'nextjs' },
          { name: 'NestJS', value: 'nestjs' },
        ],
        default: 'express',
      },
      {
        type: 'checkbox',
        name: 'methods',
        message: 'HTTP methods to generate:',
        choices: [
          { name: 'GET (list)', value: 'list', checked: true },
          { name: 'GET (single)', value: 'get', checked: true },
          { name: 'POST (create)', value: 'create', checked: true },
          { name: 'PUT (update)', value: 'update', checked: true },
          { name: 'DELETE', value: 'delete', checked: true },
        ],
      },
      {
        type: 'confirm',
        name: 'hasAuth',
        message: 'Require authentication?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'hasValidation',
        message: 'Include request validation?',
        default: true,
      },
    ],
    actions: (data) => {
      const actions = [];

      if (data.framework === 'express') {
        actions.push(
          {
            type: 'add',
            path: 'src/routes/{{kebabCase name}}.routes.ts',
            templateFile: 'plop/templates/api/express/routes.ts.hbs',
          },
          {
            type: 'add',
            path: 'src/controllers/{{kebabCase name}}.controller.ts',
            templateFile: 'plop/templates/api/express/controller.ts.hbs',
          },
          {
            type: 'add',
            path: 'src/services/{{kebabCase name}}.service.ts',
            templateFile: 'plop/templates/api/express/service.ts.hbs',
          }
        );

        if (data.hasValidation) {
          actions.push({
            type: 'add',
            path: 'src/validators/{{kebabCase name}}.validator.ts',
            templateFile: 'plop/templates/api/express/validator.ts.hbs',
          });
        }
      }

      if (data.framework === 'nextjs') {
        actions.push({
          type: 'add',
          path: 'src/app/api/{{kebabCase name}}/route.ts',
          templateFile: 'plop/templates/api/nextjs/route.ts.hbs',
        });

        if (data.methods.includes('get') || data.methods.includes('update') || data.methods.includes('delete')) {
          actions.push({
            type: 'add',
            path: 'src/app/api/{{kebabCase name}}/[id]/route.ts',
            templateFile: 'plop/templates/api/nextjs/route-id.ts.hbs',
          });
        }
      }

      if (data.framework === 'nestjs') {
        actions.push(
          {
            type: 'add',
            path: 'src/{{kebabCase name}}/{{kebabCase name}}.module.ts',
            templateFile: 'plop/templates/api/nestjs/module.ts.hbs',
          },
          {
            type: 'add',
            path: 'src/{{kebabCase name}}/{{kebabCase name}}.controller.ts',
            templateFile: 'plop/templates/api/nestjs/controller.ts.hbs',
          },
          {
            type: 'add',
            path: 'src/{{kebabCase name}}/{{kebabCase name}}.service.ts',
            templateFile: 'plop/templates/api/nestjs/service.ts.hbs',
          },
          {
            type: 'add',
            path: 'src/{{kebabCase name}}/dto/create-{{kebabCase name}}.dto.ts',
            templateFile: 'plop/templates/api/nestjs/create-dto.ts.hbs',
          },
          {
            type: 'add',
            path: 'src/{{kebabCase name}}/dto/update-{{kebabCase name}}.dto.ts',
            templateFile: 'plop/templates/api/nestjs/update-dto.ts.hbs',
          }
        );
      }

      // Add tests
      actions.push({
        type: 'add',
        path: 'src/__tests__/{{kebabCase name}}.test.ts',
        templateFile: `plop/templates/api/${data.framework}/test.ts.hbs`,
      });

      return actions;
    },
  });
};
```

### Express API Templates

```handlebars
{{!-- plop/templates/api/express/routes.ts.hbs --}}
import { Router } from 'express';
import * as controller from '../controllers/{{kebabCase name}}.controller';
{{#if hasAuth}}
import { authenticate } from '../middleware/auth';
{{/if}}
{{#if hasValidation}}
import { validate } from '../middleware/validate';
import * as validators from '../validators/{{kebabCase name}}.validator';
{{/if}}

const router = Router();

{{#if hasAuth}}
// Apply authentication to all routes
router.use(authenticate);
{{/if}}

{{#each methods}}
{{#ifEquals this "list"}}
// GET /{{kebabCase ../name}} - List all {{kebabCase ../name}}
router.get('/', controller.list);
{{/ifEquals}}
{{#ifEquals this "get"}}
// GET /{{kebabCase ../name}}/:id - Get single {{kebabCase ../name}}
router.get('/:id', controller.getById);
{{/ifEquals}}
{{#ifEquals this "create"}}
// POST /{{kebabCase ../name}} - Create new {{kebabCase ../name}}
router.post(
  '/',
{{#if ../hasValidation}}
  validate(validators.create{{pascalCase ../name}}Schema),
{{/if}}
  controller.create
);
{{/ifEquals}}
{{#ifEquals this "update"}}
// PUT /{{kebabCase ../name}}/:id - Update {{kebabCase ../name}}
router.put(
  '/:id',
{{#if ../hasValidation}}
  validate(validators.update{{pascalCase ../name}}Schema),
{{/if}}
  controller.update
);
{{/ifEquals}}
{{#ifEquals this "delete"}}
// DELETE /{{kebabCase ../name}}/:id - Delete {{kebabCase ../name}}
router.delete('/:id', controller.remove);
{{/ifEquals}}
{{/each}}

export default router;
```

```handlebars
{{!-- plop/templates/api/express/controller.ts.hbs --}}
import { Request, Response, NextFunction } from 'express';
import * as {{camelCase name}}Service from '../services/{{kebabCase name}}.service';
import { AppError } from '../utils/errors';

{{#each methods}}
{{#ifEquals this "list"}}
export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const result = await {{camelCase ../name}}Service.findAll({
      page: Number(page),
      limit: Number(limit),
      filters,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};
{{/ifEquals}}
{{#ifEquals this "get"}}

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await {{camelCase ../name}}Service.findById(id);

    if (!item) {
      throw new AppError('{{pascalCase ../name}} not found', 404);
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
};
{{/ifEquals}}
{{#ifEquals this "create"}}

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const item = await {{camelCase ../name}}Service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};
{{/ifEquals}}
{{#ifEquals this "update"}}

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await {{camelCase ../name}}Service.update(id, req.body);

    if (!item) {
      throw new AppError('{{pascalCase ../name}} not found', 404);
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
};
{{/ifEquals}}
{{#ifEquals this "delete"}}

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await {{camelCase ../name}}Service.remove(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
{{/ifEquals}}
{{/each}}
```

```handlebars
{{!-- plop/templates/api/express/service.ts.hbs --}}
import { db } from '../db';

export interface {{pascalCase name}} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add your fields here
}

export interface Create{{pascalCase name}}Input {
  // Add your input fields here
}

export interface Update{{pascalCase name}}Input {
  // Add your update fields here
}

export interface FindAllOptions {
  page: number;
  limit: number;
  filters: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const findAll = async (
  options: FindAllOptions
): Promise<PaginatedResult<{{pascalCase name}}>> => {
  const { page, limit, filters } = options;
  const offset = (page - 1) * limit;

  // Replace with your database query
  const [data, total] = await Promise.all([
    db.{{camelCase name}}.findMany({
      where: filters,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.{{camelCase name}}.count({ where: filters }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const findById = async (id: string): Promise<{{pascalCase name}} | null> => {
  return db.{{camelCase name}}.findUnique({ where: { id } });
};

export const create = async (
  input: Create{{pascalCase name}}Input
): Promise<{{pascalCase name}}> => {
  return db.{{camelCase name}}.create({ data: input });
};

export const update = async (
  id: string,
  input: Update{{pascalCase name}}Input
): Promise<{{pascalCase name}} | null> => {
  return db.{{camelCase name}}.update({
    where: { id },
    data: input,
  });
};

export const remove = async (id: string): Promise<void> => {
  await db.{{camelCase name}}.delete({ where: { id } });
};
```

```handlebars
{{!-- plop/templates/api/express/validator.ts.hbs --}}
import { z } from 'zod';

export const create{{pascalCase name}}Schema = z.object({
  body: z.object({
    // Add your validation rules here
    // name: z.string().min(1).max(255),
    // email: z.string().email(),
  }),
});

export const update{{pascalCase name}}Schema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    // Add your validation rules here (all optional for updates)
    // name: z.string().min(1).max(255).optional(),
    // email: z.string().email().optional(),
  }),
});

export type Create{{pascalCase name}}Input = z.infer<typeof create{{pascalCase name}}Schema>['body'];
export type Update{{pascalCase name}}Input = z.infer<typeof update{{pascalCase name}}Schema>['body'];
```

### Database Migration Generator

```javascript
// plop/generators/database-migration.js
module.exports = function (plop) {
  plop.setGenerator('migration', {
    description: 'Create a database migration',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Migration name (e.g., add-users-table, add-email-index):',
        validate: (value) => {
          if (!value) return 'Migration name is required';
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'Migration name must be lowercase with hyphens';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'type',
        message: 'Migration type:',
        choices: [
          { name: 'Create Table', value: 'create-table' },
          { name: 'Alter Table', value: 'alter-table' },
          { name: 'Add Index', value: 'add-index' },
          { name: 'Add Foreign Key', value: 'add-fk' },
          { name: 'Custom SQL', value: 'custom' },
        ],
      },
      {
        type: 'input',
        name: 'tableName',
        message: 'Table name:',
        when: (answers) => ['create-table', 'alter-table', 'add-index', 'add-fk'].includes(answers.type),
      },
      {
        type: 'list',
        name: 'tool',
        message: 'Migration tool:',
        choices: [
          { name: 'Prisma', value: 'prisma' },
          { name: 'TypeORM', value: 'typeorm' },
          { name: 'Knex.js', value: 'knex' },
          { name: 'Sequelize', value: 'sequelize' },
          { name: 'Raw SQL', value: 'sql' },
        ],
        default: 'prisma',
      },
    ],
    actions: (data) => {
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const actions = [];

      if (data.tool === 'prisma') {
        actions.push({
          type: 'add',
          path: 'prisma/migrations/{{timestamp}}_{{kebabCase name}}/migration.sql',
          templateFile: 'plop/templates/migration/prisma.sql.hbs',
          data: { timestamp },
        });
      } else if (data.tool === 'typeorm') {
        actions.push({
          type: 'add',
          path: 'src/migrations/{{timestamp}}-{{pascalCase name}}.ts',
          templateFile: 'plop/templates/migration/typeorm.ts.hbs',
          data: { timestamp },
        });
      } else if (data.tool === 'knex') {
        actions.push({
          type: 'add',
          path: 'migrations/{{timestamp}}_{{snakeCase name}}.ts',
          templateFile: 'plop/templates/migration/knex.ts.hbs',
          data: { timestamp },
        });
      } else if (data.tool === 'sql') {
        actions.push(
          {
            type: 'add',
            path: 'migrations/{{timestamp}}_{{snakeCase name}}_up.sql',
            templateFile: 'plop/templates/migration/sql-up.sql.hbs',
            data: { timestamp },
          },
          {
            type: 'add',
            path: 'migrations/{{timestamp}}_{{snakeCase name}}_down.sql',
            templateFile: 'plop/templates/migration/sql-down.sql.hbs',
            data: { timestamp },
          }
        );
      }

      return actions;
    },
  });
};
```

### Migration Templates

```handlebars
{{!-- plop/templates/migration/typeorm.ts.hbs --}}
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class {{pascalCase name}}{{timestamp}} implements MigrationInterface {
  name = '{{pascalCase name}}{{timestamp}}';

  public async up(queryRunner: QueryRunner): Promise<void> {
{{#ifEquals type "create-table"}}
    await queryRunner.createTable(
      new Table({
        name: '{{snakeCase tableName}}',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          // Add your columns here
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
{{/ifEquals}}
{{#ifEquals type "alter-table"}}
    await queryRunner.query(`
      ALTER TABLE "{{snakeCase tableName}}"
      -- Add your alterations here
    `);
{{/ifEquals}}
{{#ifEquals type "add-index"}}
    await queryRunner.createIndex(
      '{{snakeCase tableName}}',
      new TableIndex({
        name: 'IDX_{{upperCase (snakeCase tableName)}}_COLUMN',
        columnNames: ['column_name'],
      })
    );
{{/ifEquals}}
{{#ifEquals type "add-fk"}}
    await queryRunner.createForeignKey(
      '{{snakeCase tableName}}',
      new TableForeignKey({
        columnNames: ['foreign_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'referenced_table',
        onDelete: 'CASCADE',
      })
    );
{{/ifEquals}}
{{#ifEquals type "custom"}}
    await queryRunner.query(`
      -- Add your custom SQL here
    `);
{{/ifEquals}}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
{{#ifEquals type "create-table"}}
    await queryRunner.dropTable('{{snakeCase tableName}}');
{{/ifEquals}}
{{#ifEquals type "alter-table"}}
    await queryRunner.query(`
      ALTER TABLE "{{snakeCase tableName}}"
      -- Reverse your alterations here
    `);
{{/ifEquals}}
{{#ifEquals type "add-index"}}
    await queryRunner.dropIndex('{{snakeCase tableName}}', 'IDX_{{upperCase (snakeCase tableName)}}_COLUMN');
{{/ifEquals}}
{{#ifEquals type "add-fk"}}
    const table = await queryRunner.getTable('{{snakeCase tableName}}');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('foreign_id') !== -1
    );
    await queryRunner.dropForeignKey('{{snakeCase tableName}}', foreignKey);
{{/ifEquals}}
{{#ifEquals type "custom"}}
    await queryRunner.query(`
      -- Reverse your custom SQL here
    `);
{{/ifEquals}}
  }
}
```

```handlebars
{{!-- plop/templates/migration/knex.ts.hbs --}}
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
{{#ifEquals type "create-table"}}
  return knex.schema.createTable('{{snakeCase tableName}}', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    // Add your columns here
    table.timestamps(true, true);
  });
{{/ifEquals}}
{{#ifEquals type "alter-table"}}
  return knex.schema.alterTable('{{snakeCase tableName}}', (table) => {
    // Add your alterations here
  });
{{/ifEquals}}
{{#ifEquals type "add-index"}}
  return knex.schema.alterTable('{{snakeCase tableName}}', (table) => {
    table.index(['column_name'], 'idx_{{snakeCase tableName}}_column');
  });
{{/ifEquals}}
{{#ifEquals type "add-fk"}}
  return knex.schema.alterTable('{{snakeCase tableName}}', (table) => {
    table.foreign('foreign_id').references('id').inTable('referenced_table').onDelete('CASCADE');
  });
{{/ifEquals}}
{{#ifEquals type "custom"}}
  return knex.raw(`
    -- Add your custom SQL here
  `);
{{/ifEquals}}
}

export async function down(knex: Knex): Promise<void> {
{{#ifEquals type "create-table"}}
  return knex.schema.dropTable('{{snakeCase tableName}}');
{{/ifEquals}}
{{#ifEquals type "alter-table"}}
  return knex.schema.alterTable('{{snakeCase tableName}}', (table) => {
    // Reverse your alterations here
  });
{{/ifEquals}}
{{#ifEquals type "add-index"}}
  return knex.schema.alterTable('{{snakeCase tableName}}', (table) => {
    table.dropIndex(['column_name'], 'idx_{{snakeCase tableName}}_column');
  });
{{/ifEquals}}
{{#ifEquals type "add-fk"}}
  return knex.schema.alterTable('{{snakeCase tableName}}', (table) => {
    table.dropForeign(['foreign_id']);
  });
{{/ifEquals}}
{{#ifEquals type "custom"}}
  return knex.raw(`
    -- Reverse your custom SQL here
  `);
{{/ifEquals}}
}
```

### React Hook Generator

```javascript
// plop/generators/hook.js
module.exports = function (plop) {
  plop.setGenerator('hook', {
    description: 'Create a React hook',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Hook name (without "use" prefix):',
        validate: (value) => {
          if (!value) return 'Hook name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Hook name must be PascalCase';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'type',
        message: 'Hook type:',
        choices: [
          { name: 'State Hook', value: 'state' },
          { name: 'Effect Hook', value: 'effect' },
          { name: 'API/Fetch Hook', value: 'api' },
          { name: 'Form Hook', value: 'form' },
          { name: 'Custom Logic Hook', value: 'custom' },
        ],
        default: 'state',
      },
      {
        type: 'confirm',
        name: 'hasTests',
        message: 'Include tests?',
        default: true,
      },
    ],
    actions: (data) => {
      const actions = [
        {
          type: 'add',
          path: 'src/hooks/use{{pascalCase name}}/use{{pascalCase name}}.ts',
          templateFile: `plop/templates/hook/${data.type}.ts.hbs`,
        },
        {
          type: 'add',
          path: 'src/hooks/use{{pascalCase name}}/index.ts',
          templateFile: 'plop/templates/hook/index.ts.hbs',
        },
      ];

      if (data.hasTests) {
        actions.push({
          type: 'add',
          path: 'src/hooks/use{{pascalCase name}}/use{{pascalCase name}}.test.ts',
          templateFile: `plop/templates/hook/${data.type}.test.ts.hbs`,
        });
      }

      return actions;
    },
  });
};
```

```handlebars
{{!-- plop/templates/hook/api.ts.hbs --}}
import { useState, useEffect, useCallback } from 'react';

interface Use{{pascalCase name}}Options<T> {
  /** Initial data */
  initialData?: T;
  /** Enable automatic fetching */
  enabled?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
}

interface Use{{pascalCase name}}Result<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing {{name}} data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = use{{pascalCase name}}({
 *   enabled: true,
 * });
 * ```
 */
export function use{{pascalCase name}}<T = unknown>(
  options: Use{{pascalCase name}}Options<T> = {}
): Use{{pascalCase name}}Result<T> {
  const { initialData, enabled = true, refetchInterval } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Replace with your API call
      const response = await fetch('/api/{{kebabCase name}}');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== undefined && error === null,
    refetch: fetchData,
  };
}
```

```handlebars
{{!-- plop/templates/hook/api.test.ts.hbs --}}
import { renderHook, waitFor, act } from '@testing-library/react';
import { use{{pascalCase name}} } from './use{{pascalCase name}}';

// Mock fetch
global.fetch = jest.fn();

describe('use{{pascalCase name}}', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => use{{pascalCase name}}());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should handle errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => use{{pascalCase name}}());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.isError).toBe(true);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should not fetch when disabled', () => {
    renderHook(() => use{{pascalCase name}}({ enabled: false }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should refetch on demand', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    const { result } = renderHook(() => use{{pascalCase name}}());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
```

---

## Copier Templates

Copier is a Python-based project templating tool that supports advanced features like
conditional files and post-generation hooks.

### Project Structure

```text
my-copier-template/
  copier.yml                 # Template configuration
  template/                  # Template files
    {{project_slug}}/
      pyproject.toml.jinja
      README.md.jinja
      src/
        {{project_slug}}/
          __init__.py.jinja
          main.py.jinja
      tests/
        __init__.py
        test_main.py.jinja
  hooks/
    post_gen_project.py      # Post-generation hook
```

### Copier Configuration

```yaml
# copier.yml
_min_copier_version: "9.0.0"
_subdirectory: template
_skip_if_exists:
  - "*.lock"
  - ".env"

# Project metadata
project_name:
  type: str
  help: "Project name"
  placeholder: "My Awesome Project"
  validator: >-
    {% if not project_name %}
    Project name is required
    {% endif %}

project_slug:
  type: str
  help: "Project slug (used for package name)"
  default: "{{ project_name | lower | replace(' ', '-') | replace('_', '-') }}"
  validator: >-
    {% if not project_slug | regex_search('^[a-z][a-z0-9-]*$') %}
    Project slug must be lowercase with hyphens
    {% endif %}

project_description:
  type: str
  help: "Short project description"
  default: "A new project"

author_name:
  type: str
  help: "Author name"
  default: "{{ 'git config user.name' | shell | trim }}"

author_email:
  type: str
  help: "Author email"
  default: "{{ 'git config user.email' | shell | trim }}"

python_version:
  type: str
  help: "Minimum Python version"
  choices:
    - "3.10"
    - "3.11"
    - "3.12"
  default: "3.11"

# Features
use_pytest:
  type: bool
  help: "Use pytest for testing?"
  default: true

use_mypy:
  type: bool
  help: "Use mypy for type checking?"
  default: true

use_ruff:
  type: bool
  help: "Use ruff for linting?"
  default: true

use_pre_commit:
  type: bool
  help: "Use pre-commit hooks?"
  default: true

use_docker:
  type: bool
  help: "Include Docker configuration?"
  default: false

use_github_actions:
  type: bool
  help: "Include GitHub Actions CI?"
  default: true

# License
license:
  type: str
  help: "License type"
  choices:
    MIT: "MIT License"
    Apache-2.0: "Apache License 2.0"
    GPL-3.0: "GNU General Public License v3"
    BSD-3-Clause: "BSD 3-Clause License"
    None: "No license"
  default: "MIT"
```

### Copier Template Files

```jinja2
{#- template/{{project_slug}}/pyproject.toml.jinja -#}
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "{{ project_slug }}"
version = "0.1.0"
description = "{{ project_description }}"
readme = "README.md"
requires-python = ">={{ python_version }}"
{%- if license != "None" %}
license = "{{ license }}"
{%- endif %}
authors = [
    { name = "{{ author_name }}", email = "{{ author_email }}" },
]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
{%- if license != "None" %}
    "License :: OSI Approved :: {{ license }} License",
{%- endif %}
    "Programming Language :: Python :: {{ python_version }}",
]

[project.optional-dependencies]
dev = [
{%- if use_pytest %}
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
{%- endif %}
{%- if use_mypy %}
    "mypy>=1.0.0",
{%- endif %}
{%- if use_ruff %}
    "ruff>=0.1.0",
{%- endif %}
{%- if use_pre_commit %}
    "pre-commit>=3.0.0",
{%- endif %}
]

{%- if use_ruff %}

[tool.ruff]
target-version = "py{{ python_version | replace('.', '') }}"
line-length = 100
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # Pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = [
    "E501",  # line too long (handled by formatter)
]

[tool.ruff.isort]
known-first-party = ["{{ project_slug | replace('-', '_') }}"]
{%- endif %}

{%- if use_mypy %}

[tool.mypy]
python_version = "{{ python_version }}"
strict = true
warn_return_any = true
warn_unused_ignores = true
{%- endif %}

{%- if use_pytest %}

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov={{ project_slug | replace('-', '_') }} --cov-report=term-missing"
{%- endif %}

[tool.coverage.run]
source = ["src"]
branch = true

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
```

````jinja2
{#- template/{{project_slug}}/README.md.jinja -#}
# {{ project_name }}

{{ project_description }}

## Installation

```bash
pip install {{ project_slug }}
```

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/{{ author_name | lower | replace(' ', '') }}/{{ project_slug }}.git
cd {{ project_slug }}

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"
{%- if use_pre_commit %}

# Install pre-commit hooks
pre-commit install
{%- endif %}
```

### Commands

```bash
{%- if use_pytest %}
# Run tests
pytest

# Run tests with coverage
pytest --cov
{%- endif %}

{%- if use_ruff %}
# Lint code
ruff check .

# Format code
ruff format .
{%- endif %}

{%- if use_mypy %}
# Type check
mypy src
{%- endif %}
```

## License

{%- if license != "None" %}
This project is licensed under the {{ license }} License - see the [LICENSE](LICENSE) file for details.
{%- else %}
This project is proprietary.
{%- endif %}
````

```jinja2
{#- template/{{project_slug}}/src/{{project_slug|replace('-', '_')}}/__init__.py.jinja -#}
"""{{ project_name }}

{{ project_description }}
"""

__version__ = "0.1.0"
__author__ = "{{ author_name }}"
__email__ = "{{ author_email }}"
```

```jinja2
{#- template/{{project_slug}}/src/{{project_slug|replace('-', '_')}}/main.py.jinja -#}
"""Main module for {{ project_name }}."""

from __future__ import annotations


def main() -> int:
    """Entry point for the application."""
    print("Hello from {{ project_name }}!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

```jinja2
{#- template/{{project_slug}}/tests/test_main.py.jinja -#}
"""Tests for main module."""

from {{ project_slug | replace('-', '_') }}.main import main


def test_main() -> None:
    """Test main function returns 0."""
    assert main() == 0
```

### Conditional Docker Files

```jinja2
{#- template/{{project_slug}}/Dockerfile.jinja -#}
{%- if use_docker %}
# Build stage
FROM python:{{ python_version }}-slim as builder

WORKDIR /app

# Install build dependencies
RUN pip install --no-cache-dir build

# Copy source
COPY pyproject.toml README.md ./
COPY src ./src

# Build wheel
RUN python -m build --wheel

# Runtime stage
FROM python:{{ python_version }}-slim

WORKDIR /app

# Copy wheel from builder
COPY --from=builder /app/dist/*.whl ./

# Install package
RUN pip install --no-cache-dir *.whl && rm *.whl

# Create non-root user
RUN useradd --create-home appuser
USER appuser

ENTRYPOINT ["python", "-m", "{{ project_slug | replace('-', '_') }}"]
{%- endif %}
```

### GitHub Actions Conditional

```jinja2
{#- template/{{project_slug}}/.github/workflows/ci.yml.jinja -#}
{%- if use_github_actions %}
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["{{ python_version }}", "3.12"]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ '{{' }} matrix.python-version {{ '}}' }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ '{{' }} matrix.python-version {{ '}}' }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -e ".[dev]"
{%- if use_ruff %}

      - name: Lint with ruff
        run: ruff check .
{%- endif %}
{%- if use_mypy %}

      - name: Type check with mypy
        run: mypy src
{%- endif %}
{%- if use_pytest %}

      - name: Test with pytest
        run: pytest --cov --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
{%- endif %}
{%- endif %}
```

### Post-Generation Hook

```python
# hooks/post_gen_project.py
"""Post-generation hook for Copier template."""

import subprocess
import sys
from pathlib import Path


def run_command(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return the result."""
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def main() -> int:
    """Main hook function."""
    project_dir = Path.cwd()

    print("Setting up project...")

    # Initialize git repository
    if not (project_dir / ".git").exists():
        print("Initializing git repository...")
        run_command(["git", "init"])
        run_command(["git", "add", "."])
        run_command(["git", "commit", "-m", "Initial commit from template"])

    # Create virtual environment
    print("Creating virtual environment...")
    run_command([sys.executable, "-m", "venv", "venv"])

    # Install dependencies
    print("Installing dependencies...")
    pip_path = project_dir / "venv" / "bin" / "pip"
    if sys.platform == "win32":
        pip_path = project_dir / "venv" / "Scripts" / "pip.exe"

    run_command([str(pip_path), "install", "-e", ".[dev]"])

    # Install pre-commit hooks if enabled
    if (project_dir / ".pre-commit-config.yaml").exists():
        print("Installing pre-commit hooks...")
        precommit_path = project_dir / "venv" / "bin" / "pre-commit"
        if sys.platform == "win32":
            precommit_path = project_dir / "venv" / "Scripts" / "pre-commit.exe"
        run_command([str(precommit_path), "install"])

    print("\nProject setup complete!")
    print(f"\nNext steps:")
    print(f"  cd {project_dir.name}")
    print(f"  source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
    print(f"  pytest")

    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### Using Copier

```bash
# Generate new project
copier copy https://github.com/org/my-template ./my-new-project

# Generate with answers file
copier copy --answers-file .copier-answers.yml https://github.com/org/my-template .

# Update existing project
copier update

# Update with specific version
copier update --vcs-ref v2.0.0
```

---

## Yeoman Generators

Yeoman is a scaffolding tool with a rich ecosystem of generators.

### Generator Structure

```text
generator-my-project/
  package.json
  generators/
    app/
      index.js
      templates/
        package.json.ejs
        src/
          index.ts.ejs
    component/
      index.js
      templates/
        component.tsx.ejs
```

### Yeoman Generator Package

```json
{
  "name": "generator-my-project",
  "version": "1.0.0",
  "description": "Yeoman generator for my project",
  "files": ["generators"],
  "keywords": ["yeoman-generator"],
  "dependencies": {
    "yeoman-generator": "^6.0.0",
    "chalk": "^5.0.0",
    "yosay": "^2.0.2"
  },
  "devDependencies": {
    "yeoman-test": "^8.0.0"
  }
}
```

### Main App Generator

```javascript
// generators/app/index.js
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import yosay from 'yosay';

export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    // Register options
    this.option('typescript', {
      type: Boolean,
      description: 'Use TypeScript',
      default: true,
    });

    this.option('docker', {
      type: Boolean,
      description: 'Include Docker configuration',
      default: false,
    });
  }

  async prompting() {
    this.log(yosay(`Welcome to the ${chalk.red('my-project')} generator!`));

    this.answers = await this.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: this.appname,
        validate: (input) => {
          if (!input) return 'Project name is required';
          if (!/^[a-z][a-z0-9-]*$/.test(input)) {
            return 'Project name must be lowercase with hyphens';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'A new project',
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Package manager:',
        choices: ['npm', 'yarn', 'pnpm'],
        default: 'npm',
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features:',
        choices: [
          { name: 'ESLint', value: 'eslint', checked: true },
          { name: 'Prettier', value: 'prettier', checked: true },
          { name: 'Jest', value: 'jest', checked: true },
          { name: 'Husky (git hooks)', value: 'husky', checked: true },
          { name: 'GitHub Actions', value: 'github-actions', checked: true },
        ],
      },
      {
        type: 'list',
        name: 'framework',
        message: 'Frontend framework:',
        choices: [
          { name: 'None (Node.js only)', value: 'none' },
          { name: 'React', value: 'react' },
          { name: 'Vue', value: 'vue' },
          { name: 'Next.js', value: 'nextjs' },
        ],
        default: 'none',
      },
    ]);
  }

  writing() {
    const context = {
      projectName: this.answers.projectName,
      description: this.answers.description,
      typescript: this.options.typescript,
      docker: this.options.docker,
      features: this.answers.features,
      framework: this.answers.framework,
      hasEslint: this.answers.features.includes('eslint'),
      hasPrettier: this.answers.features.includes('prettier'),
      hasJest: this.answers.features.includes('jest'),
      hasHusky: this.answers.features.includes('husky'),
      hasGithubActions: this.answers.features.includes('github-actions'),
    };

    // Copy package.json
    this.fs.copyTpl(
      this.templatePath('package.json.ejs'),
      this.destinationPath('package.json'),
      context
    );

    // Copy source files
    this.fs.copyTpl(
      this.templatePath('src/index.ts.ejs'),
      this.destinationPath(`src/index.${this.options.typescript ? 'ts' : 'js'}`),
      context
    );

    // Copy config files
    if (context.hasEslint) {
      this.fs.copyTpl(
        this.templatePath('eslint.config.js.ejs'),
        this.destinationPath('eslint.config.js'),
        context
      );
    }

    if (context.hasPrettier) {
      this.fs.copy(
        this.templatePath('.prettierrc'),
        this.destinationPath('.prettierrc')
      );
    }

    if (this.options.typescript) {
      this.fs.copyTpl(
        this.templatePath('tsconfig.json.ejs'),
        this.destinationPath('tsconfig.json'),
        context
      );
    }

    if (this.options.docker) {
      this.fs.copyTpl(
        this.templatePath('Dockerfile.ejs'),
        this.destinationPath('Dockerfile'),
        context
      );
      this.fs.copyTpl(
        this.templatePath('docker-compose.yml.ejs'),
        this.destinationPath('docker-compose.yml'),
        context
      );
    }

    if (context.hasGithubActions) {
      this.fs.copyTpl(
        this.templatePath('.github/workflows/ci.yml.ejs'),
        this.destinationPath('.github/workflows/ci.yml'),
        context
      );
    }

    // Copy static files
    this.fs.copy(
      this.templatePath('.gitignore.template'),
      this.destinationPath('.gitignore')
    );

    this.fs.copyTpl(
      this.templatePath('README.md.ejs'),
      this.destinationPath('README.md'),
      context
    );
  }

  async install() {
    const pkgManager = this.answers.packageManager;

    this.log(`\nInstalling dependencies with ${chalk.cyan(pkgManager)}...`);

    if (pkgManager === 'npm') {
      this.spawnCommandSync('npm', ['install']);
    } else if (pkgManager === 'yarn') {
      this.spawnCommandSync('yarn', ['install']);
    } else if (pkgManager === 'pnpm') {
      this.spawnCommandSync('pnpm', ['install']);
    }
  }

  end() {
    this.log('\n');
    this.log(chalk.green('Project created successfully!'));
    this.log('\nNext steps:');
    this.log(`  ${chalk.cyan('cd')} ${this.answers.projectName}`);

    if (this.answers.packageManager === 'npm') {
      this.log(`  ${chalk.cyan('npm run dev')}`);
    } else if (this.answers.packageManager === 'yarn') {
      this.log(`  ${chalk.cyan('yarn dev')}`);
    } else {
      this.log(`  ${chalk.cyan('pnpm dev')}`);
    }

    this.log('\n');
  }
}
```

### Yeoman Templates

```ejs
<%# generators/app/templates/package.json.ejs %>
{
  "name": "<%= projectName %>",
  "version": "0.1.0",
  "description": "<%= description %>",
  "main": "dist/index.js",
<% if (typescript) { %>
  "types": "dist/index.d.ts",
<% } %>
  "scripts": {
<% if (typescript) { %>
    "build": "tsc",
    "dev": "ts-node src/index.ts",
<% } else { %>
    "dev": "node src/index.js",
<% } %>
<% if (hasJest) { %>
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
<% } %>
<% if (hasEslint) { %>
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
<% } %>
<% if (hasPrettier) { %>
    "format": "prettier --write .",
    "format:check": "prettier --check .",
<% } %>
<% if (hasHusky) { %>
    "prepare": "husky install",
<% } %>
    "clean": "rm -rf dist"
  },
  "devDependencies": {
<% if (typescript) { %>
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/node": "^20.0.0",
<% } %>
<% if (hasEslint) { %>
    "eslint": "^9.0.0",
<% if (typescript) { %>
    "typescript-eslint": "^7.0.0",
<% } %>
<% } %>
<% if (hasPrettier) { %>
    "prettier": "^3.0.0",
<% } %>
<% if (hasJest) { %>
    "jest": "^29.0.0",
<% if (typescript) { %>
    "ts-jest": "^29.0.0",
    "@types/jest": "^29.0.0",
<% } %>
<% } %>
<% if (hasHusky) { %>
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
<% } %>
  },
<% if (hasHusky) { %>
  "lint-staged": {
    "*.{js,ts,tsx}": [
<% if (hasEslint) { %>
      "eslint --fix",
<% } %>
<% if (hasPrettier) { %>
      "prettier --write"
<% } %>
    ]
  },
<% } %>
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Component Sub-Generator

```javascript
// generators/component/index.js
import Generator from 'yeoman-generator';
import path from 'path';

export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.argument('name', {
      type: String,
      required: true,
      description: 'Component name',
    });
  }

  async prompting() {
    this.answers = await this.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Component type:',
        choices: ['functional', 'page', 'layout'],
        default: 'functional',
      },
      {
        type: 'confirm',
        name: 'hasStyles',
        message: 'Include CSS module?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'hasTests',
        message: 'Include tests?',
        default: true,
      },
    ]);
  }

  writing() {
    const componentName = this.options.name;
    const pascalName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    const kebabName = componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    const basePath = this.answers.type === 'page'
      ? 'src/pages'
      : this.answers.type === 'layout'
        ? 'src/layouts'
        : 'src/components';

    const context = {
      componentName: pascalName,
      kebabName,
      hasStyles: this.answers.hasStyles,
    };

    // Component file
    this.fs.copyTpl(
      this.templatePath('component.tsx.ejs'),
      this.destinationPath(path.join(basePath, pascalName, `${pascalName}.tsx`)),
      context
    );

    // Index file
    this.fs.copyTpl(
      this.templatePath('index.ts.ejs'),
      this.destinationPath(path.join(basePath, pascalName, 'index.ts')),
      context
    );

    // Styles
    if (this.answers.hasStyles) {
      this.fs.copyTpl(
        this.templatePath('styles.module.css.ejs'),
        this.destinationPath(path.join(basePath, pascalName, `${pascalName}.module.css`)),
        context
      );
    }

    // Tests
    if (this.answers.hasTests) {
      this.fs.copyTpl(
        this.templatePath('component.test.tsx.ejs'),
        this.destinationPath(path.join(basePath, pascalName, `${pascalName}.test.tsx`)),
        context
      );
    }
  }

  end() {
    this.log(`\nComponent ${this.options.name} created successfully!`);
  }
}
```

### Using Yeoman

```bash
# Install generator globally
npm install -g generator-my-project

# Generate new project
yo my-project

# Generate component
yo my-project:component Button

# Generate with options
yo my-project --typescript --docker
```

---

## Package.json Scripts

### Plop Integration

```json
{
  "scripts": {
    "generate": "plop",
    "g:component": "plop component",
    "g:api": "plop api-endpoint",
    "g:migration": "plop migration",
    "g:hook": "plop hook"
  },
  "devDependencies": {
    "plop": "^4.0.0"
  }
}
```

### Copier Integration

```json
{
  "scripts": {
    "scaffold": "copier copy https://github.com/org/template .",
    "update-template": "copier update"
  }
}
```

---

## Best Practices

### Template Organization

```text
templates/
  # Plop templates
  plop/
    generators/
      component.js
      api-endpoint.js
      hook.js
    templates/
      component/
        component.tsx.hbs
        index.ts.hbs
        styles.module.css.hbs
      api/
        controller.ts.hbs
        service.ts.hbs

  # Copier template
  copier-python-package/
    copier.yml
    template/
    hooks/

  # Yeoman generator
  generator-my-project/
    generators/
      app/
      component/
```

### Naming Conventions

```javascript
// Good - Consistent naming helpers
plop.setHelper('pascalCase', (text) => text.replace(/(^\w|-\w)/g, clearAndUpper));
plop.setHelper('camelCase', (text) => text.replace(/-./g, (m) => m[1].toUpperCase()));
plop.setHelper('kebabCase', (text) => text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase());
plop.setHelper('snakeCase', (text) => text.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase());
```

### Validation

```javascript
// Good - Comprehensive validation
{
  type: 'input',
  name: 'name',
  validate: (value) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
      return 'Name must be PascalCase (e.g., MyComponent)';
    }
    return true;
  },
}
```

---

## References

- [Plop Documentation](https://plopjs.com/)
- [Copier Documentation](https://copier.readthedocs.io/)
- [Yeoman Documentation](https://yeoman.io/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [Jinja2 Documentation](https://jinja.palletsprojects.com/)

---

**Status**: Active
