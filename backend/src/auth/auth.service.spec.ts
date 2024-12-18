import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ApiKey } from '../database/entities/api-key.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AuthService', () => {
  let authService: AuthService;
  const apiKeyRepositoryMock = {
    findOneBy: jest.mock,
  };

  const apiKeyMock = { id: 'b2ed9e5-8999-4aca-af65-6deacfd1bb9a' } as ApiKey;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: apiKeyRepositoryMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateApiKey()', () => {
    it('Should return false if the API key is in invalid format', async () => {
      apiKeyRepositoryMock.findOneBy = jest.fn().mockResolvedValue(null);

      const apiKey = 'invalid-api-key-format';

      const result = await authService.validateApiKey(apiKey);

      expect(apiKeyRepositoryMock.findOneBy).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('Should return false if the API key does not exist', async () => {
      apiKeyRepositoryMock.findOneBy = jest.fn().mockResolvedValue(null);
      const apiKey = 'b2ed9e5-8999-4aca-af65-6deacfd1bb9b';

      const result = await authService.validateApiKey(apiKey);

      expect(apiKeyRepositoryMock.findOneBy).toHaveBeenCalledWith({
        id: apiKey,
      });
      expect(result).toBe(false);
    });

    it('Should return true if the API key exists', async () => {
      apiKeyRepositoryMock.findOneBy = jest.fn().mockResolvedValue(apiKeyMock);

      const result = await authService.validateApiKey(apiKeyMock.id);

      expect(apiKeyRepositoryMock.findOneBy).toHaveBeenCalledWith({
        id: apiKeyMock.id,
      });
      expect(result).toBe(true);
    });
  });
});
