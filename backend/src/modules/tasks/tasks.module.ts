import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const TASK_STATES = ['PENDING', 'ASSIGNED', 'RUNNING', 'REVIEW', 'COMPLETED'];

@Injectable()
class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { title: string; description?: string; engineerId?: string; dueDate?: string }) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        engineerId: data.engineerId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  /** Kanban board: tasks grouped by status column. */
  async board() {
    const tasks = await this.prisma.task.findMany({
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
  create(@Body() body: any) {
    return this.tasks.create(body);
  }

  @Get('board')
  board() {
    return this.tasks.board();
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
