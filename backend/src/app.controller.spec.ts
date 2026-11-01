import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: { getHealth: jest.Mock };

  beforeEach(async () => {
    appService = { getHealth: jest.fn() };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('returns the health payload when the database is reachable', async () => {
      appService.getHealth.mockResolvedValue({
        status: 'ok',
        database: 'ok',
        timestamp: '2026-01-01T00:00:00.000Z',
      });

      await expect(appController.getHealth()).resolves.toEqual({
        status: 'ok',
        database: 'ok',
        timestamp: '2026-01-01T00:00:00.000Z',
      });
    });

    it('throws ServiceUnavailableException when the database is unreachable', async () => {
      appService.getHealth.mockResolvedValue({
        status: 'error',
        database: 'error',
        timestamp: '2026-01-01T00:00:00.000Z',
      });

      await expect(appController.getHealth()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
