export const eventData = {
  notificationType: 'Message',
  projectKey: 'yi-points-test',
  id: '104237bb-7788-43d3-9554-24c21ccae8e7',
  version: 1,
  sequenceNumber: 5,
  resource: {
    typeId: 'product',
    id: 'bed7b2a5-e6e9-4054-a967-291b9fb5056c',
  },
  resourceVersion: 13,
  resourceUserProvidedIdentifiers: {
    slug: {
      'en-US': 'test',
    },
  },
  type: 'ProductPublished',
  productProjection: {
    id: 'bed7b2a5-e6e9-4054-a967-291b9fb5056c',
    version: 7,
    productType: {
      typeId: 'product-type',
      id: 'e77d792b-db90-4314-a19b-c9407057c8f5',
    },
    name: {
      'en-US': 'Test',
    },
    description: {
      'en-US': 'Test',
    },
    categories: [],
    categoryOrderHints: {},
    slug: {
      'en-US': 'test',
    },
    metaTitle: {
      'en-GB': '',
      'de-DE': '',
      'en-US': '',
    },
    metaDescription: {
      'en-GB': '',
      'de-DE': '',
      'en-US': '',
    },
    masterVariant: {
      id: 1,
      sku: 'Test',
      prices: [
        {
          id: 'f55c157e-ce35-4ca9-b013-3fe29e6da6bc',
          value: {
            type: 'centPrecision',
            currencyCode: 'AUD',
            centAmount: 1101,
            fractionDigits: 2,
          },
          country: 'AUD',
          custom: {
            type: {
              typeId: 'type',
              id: 'a80ac7b7-bfb8-4355-bfd6-b559941d8df0',
            },
            fields: {
              paymentOption: 'pointsOnly',
              minimumCash: {
                type: 'centPrecision',
                currencyCode: 'AUD',
                centAmount: 1000,
                fractionDigits: 2,
              },
              priceRowType: 'basePrice',
              minimumPoints: 123,
              pointsPrice: 123,
            },
          },
        },
      ],
      images: [],
      attributes: [],
      assets: [],
    },
    variants: [],
    searchKeywords: {},
    hasStagedChanges: false,
    published: true,
    taxCategory: {
      typeId: 'tax-category',
      id: 'a8e492bd-158c-4d32-be30-425096fb3a80',
    },
    priceMode: 'Embedded',
    createdAt: '2024-08-23T06:50:10.495Z',
    lastModifiedAt: '2024-08-23T08:03:46.456Z',
  },
  removedImageUrls: [],
  scope: 'All',
  createdAt: '2024-08-23T08:03:46.456Z',
  lastModifiedAt: '2024-08-23T08:03:46.456Z',
  createdBy: {
    isPlatformClient: true,
    user: {
      typeId: 'user',
      id: 'aef50382-8f56-431d-9df0-4e5c2eae07e2',
    },
  },
  lastModifiedBy: {
    isPlatformClient: true,
    user: {
      typeId: 'user',
      id: 'aef50382-8f56-431d-9df0-4e5c2eae07e2',
    },
  },
};
