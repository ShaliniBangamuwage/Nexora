import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { FirebaseService } from '../../shared/firebase/firebase.service';

jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(jest.fn().mockResolvedValue({ data: [0.1, 0.2] })),
}));

const mockQuery = jest.fn();
const mockUpsert = jest.fn();
const mockDeleteOne = jest.fn();
jest.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: jest.fn().mockImplementation(() => {
      return {
        index: jest.fn().mockImplementation(() => {
          return {
            query: mockQuery,
            upsert: mockUpsert,
            deleteOne: mockDeleteOne,
          };
        }),
      };
    }),
  };
});

describe('SearchService', () => {
  let service: SearchService;
  let mockFirebaseService: any;

  beforeEach(async () => {
    mockFirebaseService = {
      getDb: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [
            {
              id: 'prod1',
              data: () => ({ name: 'Panadol Extra', nameLowercase: 'panadol extra', price: 10 }),
            },
          ],
        }),
        batch: jest.fn().mockReturnValue({
          update: jest.fn(),
          commit: jest.fn().mockResolvedValue(true),
        }),
        add: jest.fn().mockResolvedValue({ id: 'log1' }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('keywordSearch', () => {
    it('should convert query to lowercase and run range queries on nameLowercase field', async () => {
      const db = mockFirebaseService.getDb();
      mockQuery.mockResolvedValue({ matches: [] }); // clear vector results to isolate keywordSearch

      const result: any = await service.search('PanAdol');

      expect(db.collection).toHaveBeenCalledWith('products');
      expect(db.where).toHaveBeenNthCalledWith(1, 'nameLowercase', '>=', 'panadol');
      expect(db.where).toHaveBeenNthCalledWith(2, 'nameLowercase', '<=', 'panadol\uf8ff');
      expect(result.results[0].id).toBe('prod1');
    });

    it('keeps keyword search available and skips vector writes without Pinecone', async () => {
      const previousApiKey = process.env.PINECONE_API_KEY;
      const previousIndex = process.env.PINECONE_INDEX;
      process.env.PINECONE_API_KEY = '';
      process.env.PINECONE_INDEX = '';
      mockQuery.mockClear();
      mockUpsert.mockClear();
      mockDeleteOne.mockClear();

      try {
        const keywordOnlyService = new SearchService(mockFirebaseService);
        await keywordOnlyService.onModuleInit();
        const result: any = await keywordOnlyService.search('PanAdol');
        await keywordOnlyService.upsertProductToIndex('prod1', { id: 'prod1', similarityScore: 1, searchSource: 'test' });
        await keywordOnlyService.removeProductFromIndex('prod1');

        expect(result.results[0].id).toBe('prod1');
        expect(mockQuery).not.toHaveBeenCalled();
        expect(mockUpsert).not.toHaveBeenCalled();
        expect(mockDeleteOne).not.toHaveBeenCalled();
      } finally {
        if (previousApiKey === undefined) delete process.env.PINECONE_API_KEY;
        else process.env.PINECONE_API_KEY = previousApiKey;
        if (previousIndex === undefined) delete process.env.PINECONE_INDEX;
        else process.env.PINECONE_INDEX = previousIndex;
      }
    });
  });
});
