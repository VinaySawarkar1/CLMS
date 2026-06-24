import {
  Body, Controller, Get, Injectable, Module, Param, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const TASK_STATES = ['PENDING', 'ASSIGNED', 'RUNNING', 'REVIEW', 'COMPLETED'];

@Injectable()
class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(labId: string, data: { title: string; description?: string; engineerId?: string; dueDate?: string }) {
    return this.prisma.task.create({
      data: {
        labId,
        title: data.title,
        description: data.description,
        engineerId: data.engineerId ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async board(labId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { labId },
      orderBy: { createdAt: 'desc' },
    });
    const columns: Record<string, typeof tasks> = {};
    for (const state of TASK_STATES) columns[state] = [];
    for (const t of tasks) (columns[t.status] ??= []).push(t);
    return columns;
  }

  updateStatus(id: string, status: string) {
    return this.prisma.task.update({ where: { id }, data: { status } });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('tasks')
class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.tasks.create(req.user.labId, body);
  }

  @Get('board')
  board(@Request() req: any) {
    return this.tasks.board(req.user.labId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasks.updateStatus(id, status);
  }
}

@Module({
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
