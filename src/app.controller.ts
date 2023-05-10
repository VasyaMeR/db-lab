import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Render,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  @Render('index.hbs')
  getActionsList() {
    const actions = [
      {
        label: 'Вивід всіх відправок',
        href: '/0',
      },
      {
        label: 'Вивід всіх відправок вказаного користувача',
        href: '/1',
      },
      {
        label:
          'Вивід всіх відправок вказаного користувача, що мають певний статус',
        href: '/2',
      },
      {
        label:
          'Для кожної задачі знайти кількість відправок, що мають певний статус',
        href: '/3',
      },
      {
        label:
          'Знайти користувачів у яких відсоток успішних відправок більший або рівний за заданий',
        href: '/4',
      },
      {
        label: 'Статистика розвязків по кожній задачі',
        href: '/5',
      },
      {
        label:
          'Для кожної задачі, яку рішив певний користувач знайти кількість розвязків, що мають певний статус',
        href: '/6',
      },
    ];

    return { actions };
  }

  @Get('/0')
  @Render('actions0.hbs')
  async get0() {
    const res = await this.prismaService.$queryRaw`
      SELECT id, author_id, problem_id, language_name, submission.status FROM submission`;
    return { render: true, res };
  }

  @Get('/1')
  @Render('actions1.hbs')
  async get1(@Query('authorId') authorId: string) {
    if (authorId == null) return { render: false };

    const res = await this.prismaService.$queryRaw`
      SELECT id, author_id, problem_id, language_name, submission.status FROM submission
      WHERE author_id=${Number(authorId)}`;
    return { render: true, res };
  }

  @Get('/2')
  @Render('actions2.hbs')
  async get2(
    @Query('authorId') authorId: string,
    @Query('status') status: string,
  ) {
    if (authorId == null || status == null) return { render: false };

    const res = await this.prismaService.$queryRaw`
      SELECT submission.id, "user".name as author, problem.name as problem, language_name, submission.status FROM submission
      JOIN "user" ON "user".id=submission.author_id
      JOIN problem ON problem.id=problem_id
      WHERE submission.author_id=${+authorId} AND submission.status=${status}`;
    return { render: true, res };
  }

  @Get('/3')
  @Render('actions3.hbs')
  async get3(@Query('status') status: string) {
    if (status == null) return { render: false };

    const res = await this.prismaService.$queryRaw`
      SELECT problem.id, problem.name as problem, count(*) as count FROM problem
      JOIN submission ON problem.id=submission.problem_id
      WHERE submission.status=${status}
      GROUP BY problem.id, problem.name
      ORDER BY count(*)`;
    return { render: true, res };
  }

  @Get('/4')
  @Render('actions4.hbs')
  async get4(@Query('rate') rate: string) {
    if (rate == null) return { render: false };
    const rt = Number(rate);

    const res = await this.prismaService.$queryRaw`     
      SELECT "user".id, "user".name as name,
            (100.0 * (SELECT count(*) FROM submission WHERE submission.author_id="user".id AND submission.status='Accepted')
                / (SELECT count(*) FROM submission WHERE submission.author_id="user".id)) as "rate" FROM "user"
      WHERE (100.0 * (SELECT count(*) FROM submission WHERE submission.author_id="user".id AND submission.status='Accepted')
                / (SELECT count(*) FROM submission WHERE submission.author_id="user".id))>=${rt};`;
    return { render: true, res };
  }

  @Get('/5')
  @Render('actions5.hbs')
  async get5() {
    const res = await this.prismaService.$queryRaw`     
      SELECT problem.id, problem.name, submission.status, count(*) as count FROM problem
      JOIN submission ON submission.problem_id=problem.id
      GROUP BY problem.id, problem.name, submission.status
      ORDER BY count`;
    return { render: true, res };
  }

  @Get('/6')
  @Render('actions6.hbs')
  async get6(
    @Query('authorId') authorId: string,
    @Query('status') status: string,
  ) {
    if (authorId == null || status == null) return { render: false };

    const res = await this.prismaService.$queryRaw`     
      SELECT T1.id, T1.name, submission.status, count(*) as count FROM 
        (SELECT DISTINCT problem.id as id, problem.name as name FROM submission
        JOIN problem ON submission.problem_id=problem.id
        WHERE submission.author_id=${+authorId} AND submission.status='Accepted') as T1
      JOIN submission ON submission.problem_id=T1.id
      GROUP BY T1.id, T1.name, submission.status
      HAVING submission.status=${status}
      ORDER BY count`;
    return { render: true, res };
  }

  @Get('/statistic')
  @Render('statistic.hbs')
  async getStatistic() {
    const res = await this.prismaService.$queryRaw`     
      SELECT problem.id, problem.name, submission.status, count(*) as count FROM problem
      JOIN submission ON submission.problem_id=problem.id
      GROUP BY problem.id, problem.name, submission.status
      ORDER BY problem.id, submission.status`;
    return { render: true, res };
  }

  @Get('/ranking')
  @Render('ranking.hbs')
  async getRanking() {
    const res = await this.prismaService.$queryRaw`     
      SELECT "user".id, "user".name, count(*) as count FROM "user"
      JOIN submission ON submission.author_id="user".id
      WHERE submission.status='Accepted'
      GROUP BY "user".id, "user".name
      ORDER BY count DESC`;
    return { render: true, res };
  }

  @Get('/ranking1')
  @Render('ranking1.hbs')
  async getRanking1(@Query('rate') rate: string) {
    if (rate == null) rate = '0';
    const rt = Number(rate);

    const res = await this.prismaService.$queryRaw`     
      SELECT "user".id, "user".name as name,
            (100.0 * (SELECT count(*) FROM submission WHERE submission.author_id="user".id AND submission.status='Accepted')
                / (SELECT count(*) FROM submission WHERE submission.author_id="user".id)) as "rate" FROM "user"
      WHERE (100.0 * (SELECT count(*) FROM submission WHERE submission.author_id="user".id AND submission.status='Accepted')
                / (SELECT count(*) FROM submission WHERE submission.author_id="user".id))>=${rt};`;
    return { render: true, res };
  }

  @Get('/problems')
  @Render('problems.hbs')
  async getProblems(
    @Query('skip') skip: string,
    @Query('limit') limit: string,
  ) {
    const sk = skip ? Number(skip) : 0;
    const lm = limit ? Number(limit) : 3;

    const res = await this.prismaService.$queryRaw`     
      SELECT problem.id, problem.name, "user".name as author FROM problem
      JOIN "user" ON "user".id="problem".author_id
      ORDER BY problem.id
      OFFSET ${sk}
      LIMIT ${lm}`;
    return { render: true, res };
  }

  @Get('/submissions')
  @Render('submissions.hbs')
  async getSubmissions() {
    const res = await this.prismaService.$queryRaw`     
      SELECT submission.id, submission.problem_id, problem.name, "user".name as author, submission.status, submission.language_name, submission.language_version FROM submission
      JOIN "user" ON "user".id="submission".author_id
      JOIN "problem" ON "problem".id="submission".problem_id
      `;
    return { render: true, res };
  }

  @Get('/problems/:id')
  @Render('problem.hbs')
  async getProblem(@Param('id') id_str: string) {
    const id = Number(id_str);

    const res = (await this.prismaService.$queryRaw`     
      SELECT problem.id, problem.name, problem.statement, "user".name as author FROM problem
      JOIN "user" ON "user".id="problem".author_id
      WHERE problem.id=${id}`) as any;

    if (res.length == 0) return { render: false, res: null };
    return { render: true, res: res[0] };
  }

  @Get('/problems/:id/submit')
  @Render('submit.hbs')
  async getSubmit(@Param('id') id_str: string) {
    const id = Number(id_str);

    const problems = (await this.prismaService.$queryRaw`     
      SELECT problem.id, problem.name, problem.statement, "user".name as author FROM problem
      JOIN "user" ON "user".id="problem".author_id
      WHERE problem.id=${id}`) as any;

    if (problems.length == 0) return { render: false, res: null };

    const languages = (await this.prismaService.$queryRaw`     
      SELECT "language".name, "language".version FROM "language"`) as any;

    return { render: true, res: { languages } };
  }

  @Post('/problems/:id/submit')
  @Redirect('/submissions')
  async receiveSubmit(
    @Param('id') id_str: string,
    @Body() createSubmission: any,
  ) {
    const id = Number(id_str);

    const problems = (await this.prismaService.$queryRaw`     
      SELECT problem.id, problem.name, problem.statement, "user".name as author FROM problem
      JOIN "user" ON "user".id="problem".author_id
      WHERE problem.id=${id}`) as any;

    if (problems.length == 0) return;

    const [language_name, language_version] =
      createSubmission.language.split(';');
    const statuses = (await this.prismaService.$queryRaw`
      SELECT "name" FROM "status"
    `) as any;

    const status = statuses[Math.floor(Math.random() * statuses.length)].name;

    const affected = await this.prismaService.$executeRaw`
      INSERT INTO "submission" (author_id, problem_id, "status", language_name, language_version)
      VALUES (1, ${id}, ${status}, ${language_name}, ${language_version})
    `;

    return affected;
  }
}
