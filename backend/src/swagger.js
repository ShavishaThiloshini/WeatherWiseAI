/**
 * OpenAPI 3.0.3 Specification for WeatherWise AI Backend API
 * Serves at: /api-docs (interactive UI) and /api-docs.json (raw spec)
 */

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'WeatherWise AI API',
    description: 'Smart Weather Assistant - Backend REST API for weather insights, personalized recommendations, and travel safety scoring.',
    version: '1.0.0',
    contact: {
      name: 'WeatherWise AI Team',
      url: 'https://github.com/weatherwise-ai'
    },
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:8001',
      description: 'Local development server'
    },
    {
      url: 'https://api.weatherwise.example.com',
      description: 'Production server (example)'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Service health and status endpoints'
    },
    {
      name: 'Authentication',
      description: 'User registration and login'
    },
    {
      name: 'Weather',
      description: 'Current weather and forecast data'
    },
    {
      name: 'Recommendations',
      description: 'Smart weather-based recommendations and advice'
    },
    {
      name: 'Travel',
      description: 'Travel safety and weather comparison'
    },
    {
      name: 'Locations',
      description: 'User location management'
    },
    {
      name: 'Plants',
      description: 'Plant profiles and watering advice'
    },
    {
      name: 'History',
      description: 'Weather history and trends'
    },
    {
      name: 'Alerts',
      description: 'Severe weather alerts'
    },
    {
      name: 'Assistant',
      description: 'AI-powered weather assistant'
    },
    {
      name: 'User Preferences',
      description: 'Personalization settings'
    }
  ],
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'Root service endpoint',
        description: 'Returns basic service information and links to key resources.',
        operationId: 'getServiceInfo',
        responses: {
          '200': {
            description: 'Service is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      example: 'WeatherWise AI API'
                    },
                    status: {
                      type: 'string',
                      example: 'running'
                    },
                    health: {
                      type: 'string',
                      example: '/api/v1/health'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        description: 'Returns detailed health status including service name, environment, and timestamp.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'service', 'environment', 'timestamp'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ok'],
                      example: 'ok'
                    },
                    service: {
                      type: 'string',
                      example: 'weatherwise-ai-api'
                    },
                    environment: {
                      type: 'string',
                      enum: ['development', 'staging', 'production'],
                      example: 'development'
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                      example: '2024-01-15T10:30:45.123Z'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        description: 'Create a new user account with email, password, and optional profile information.',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 8,
                    example: 'SecurePassword123!'
                  },
                  firstName: {
                    type: 'string',
                    example: 'John'
                  },
                  lastName: {
                    type: 'string',
                    example: 'Doe'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: {
                      type: 'string',
                      example: 'usr_123abc'
                    },
                    email: {
                      type: 'string',
                      example: 'user@example.com'
                    },
                    token: {
                      type: 'string',
                      description: 'JWT authentication token'
                    }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/Conflict' }
        }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user with email and password, return JWT token.',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'SecurePassword123!'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                      description: 'JWT authentication token'
                    },
                    userId: {
                      type: 'string',
                      example: 'usr_123abc'
                    },
                    expiresIn: {
                      type: 'integer',
                      description: 'Token expiration time in seconds',
                      example: 86400
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '400': { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/api/v1/weather/current': {
      get: {
        tags: ['Weather'],
        summary: 'Get current weather',
        description: 'Fetch current weather conditions for a specified location.',
        operationId: 'getCurrentWeather',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'locationId',
            in: 'query',
            description: 'ID of the saved location or coordinates',
            required: true,
            schema: {
              type: 'string',
              example: 'loc_456def'
            }
          },
          {
            name: 'units',
            in: 'query',
            description: 'Temperature units (celsius or fahrenheit)',
            schema: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              default: 'celsius'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Current weather data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    locationId: { type: 'string' },
                    locationName: { type: 'string' },
                    temperature: { type: 'number' },
                    condition: { type: 'string' },
                    humidity: { type: 'integer' },
                    windSpeed: { type: 'number' },
                    uvIndex: { type: 'integer' },
                    feelsLike: { type: 'number' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/v1/weather/forecast': {
      get: {
        tags: ['Weather'],
        summary: 'Get weather forecast',
        description: 'Fetch hourly and multi-day weather forecast for a location.',
        operationId: 'getWeatherForecast',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'locationId',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'loc_456def' }
          },
          {
            name: 'days',
            in: 'query',
            schema: { type: 'integer', default: 7, maximum: 30 }
          }
        ],
        responses: {
          '200': {
            description: 'Weather forecast data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    locationId: { type: 'string' },
                    forecast: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string', format: 'date' },
                          high: { type: 'number' },
                          low: { type: 'number' },
                          condition: { type: 'string' },
                          precipitation: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/advice/today': {
      get: {
        tags: ['Recommendations'],
        summary: 'Get smart daily advice',
        description: 'Get AI-powered personalized advice based on current weather and user preferences.',
        operationId: 'getDailyAdvice',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'locationId',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Personalized weather advice',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    advice: { type: 'string' },
                    category: {
                      type: 'string',
                      enum: ['outdoor', 'indoor', 'safety', 'health', 'activity']
                    },
                    severity: {
                      type: 'string',
                      enum: ['low', 'medium', 'high', 'critical']
                    },
                    factors: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/alerts': {
      get: {
        tags: ['Alerts'],
        summary: 'Get active weather alerts',
        description: 'Retrieve all active severe weather alerts for the user\'s locations.',
        operationId: 'getAlerts',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of active alerts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    alerts: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          alertId: { type: 'string' },
                          type: { type: 'string' },
                          severity: {
                            type: 'string',
                            enum: ['advisory', 'watch', 'warning']
                          },
                          description: { type: 'string' },
                          issuedAt: { type: 'string', format: 'date-time' },
                          expiresAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    },
                    count: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/travel/compare': {
      post: {
        tags: ['Travel'],
        summary: 'Compare travel destination weather',
        description: 'Compare current location weather with destination and return travel risk score.',
        operationId: 'compareTravelWeather',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fromLocationId', 'toLocationId'],
                properties: {
                  fromLocationId: { type: 'string' },
                  toLocationId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Travel weather comparison and risk score',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currentLocation: {
                      type: 'object',
                      properties: {
                        temperature: { type: 'number' },
                        condition: { type: 'string' }
                      }
                    },
                    destination: {
                      type: 'object',
                      properties: {
                        temperature: { type: 'number' },
                        condition: { type: 'string' }
                      }
                    },
                    riskScore: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 100,
                      description: 'Travel risk score (0=safe, 100=extreme risk)'
                    },
                    recommendations: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/locations': {
      get: {
        tags: ['Locations'],
        summary: 'List user locations',
        description: 'Retrieve all saved locations for the current user.',
        operationId: 'getLocations',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of user locations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    locations: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Location'
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      },
      post: {
        tags: ['Locations'],
        summary: 'Add new location',
        description: 'Save a new location to the user\'s location list.',
        operationId: 'createLocation',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'latitude', 'longitude'],
                properties: {
                  name: { type: 'string', example: 'Home' },
                  latitude: { type: 'number', example: 40.7128 },
                  longitude: { type: 'number', example: -74.0060 },
                  isDefault: { type: 'boolean', default: false }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Location created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Location' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/plants': {
      get: {
        tags: ['Plants'],
        summary: 'List user plants',
        description: 'Retrieve all plant profiles saved by the user.',
        operationId: 'getPlants',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of user plants',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plants: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Plant'
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      },
      post: {
        tags: ['Plants'],
        summary: 'Add new plant',
        description: 'Add a new plant profile and get watering/care advice.',
        operationId: 'createPlant',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'species', 'locationId'],
                properties: {
                  name: { type: 'string', example: 'My Rose' },
                  species: { type: 'string', example: 'Rosa spp.' },
                  locationId: { type: 'string' },
                  wateringFrequencyDays: { type: 'integer', default: 3 }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Plant created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Plant' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/history': {
      get: {
        tags: ['History'],
        summary: 'Get weather history',
        description: 'Retrieve daily/weekly weather history and trends for a location.',
        operationId: 'getWeatherHistory',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'locationId',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'days',
            in: 'query',
            schema: { type: 'integer', default: 30 }
          }
        ],
        responses: {
          '200': {
            description: 'Historical weather data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    history: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string', format: 'date' },
                          avgTemperature: { type: 'number' },
                          maxTemperature: { type: 'number' },
                          minTemperature: { type: 'number' },
                          precipitation: { type: 'number' }
                        }
                      }
                    },
                    trends: {
                      type: 'object',
                      properties: {
                        temperatureTrend: { type: 'string' },
                        precipitationTrend: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/assistant/ask': {
      post: {
        tags: ['Assistant'],
        summary: 'Ask the AI Weather Assistant',
        description: 'Ask a natural-language question about weather, receive AI-powered response grounded in current/forecast data.',
        operationId: 'askAssistant',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: {
                    type: 'string',
                    example: 'Should I bring an umbrella tomorrow?',
                    minLength: 1
                  },
                  locationId: {
                    type: 'string',
                    description: 'Optional: specific location context'
                  },
                  context: {
                    type: 'object',
                    description: 'Optional: additional context',
                    properties: {
                      activityType: {
                        type: 'string',
                        example: 'hiking'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'AI assistant response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    provider: { type: 'string', example: 'gemini' },
                    answer: { type: 'string' },
                    confidence: {
                      type: 'number',
                      minimum: 0,
                      maximum: 1
                    },
                    reasoning: { type: 'string' },
                    suggestedAction: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/v1/users/preferences': {
      get: {
        tags: ['User Preferences'],
        summary: 'Get user preferences',
        description: 'Retrieve personalization settings and preferences.',
        operationId: 'getUserPreferences',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User preferences',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserPreferences'
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      },
      patch: {
        tags: ['User Preferences'],
        summary: 'Update user preferences',
        description: 'Modify personalization settings and preferences.',
        operationId: 'updateUserPreferences',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserPreferences'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Preferences updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserPreferences'
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/v1/auth/login'
      }
    },
    schemas: {
      Location: {
        type: 'object',
        required: ['locationId', 'name', 'latitude', 'longitude'],
        properties: {
          locationId: {
            type: 'string',
            example: 'loc_123abc'
          },
          name: {
            type: 'string',
            example: 'New York'
          },
          latitude: {
            type: 'number',
            example: 40.7128
          },
          longitude: {
            type: 'number',
            example: -74.0060
          },
          isDefault: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Plant: {
        type: 'object',
        required: ['plantId', 'name', 'species', 'locationId'],
        properties: {
          plantId: {
            type: 'string',
            example: 'plant_456def'
          },
          name: {
            type: 'string',
            example: 'Kitchen Basil'
          },
          species: {
            type: 'string',
            example: 'Ocimum basilicum'
          },
          locationId: {
            type: 'string'
          },
          wateringFrequencyDays: {
            type: 'integer',
            example: 3
          },
          lastWatered: {
            type: 'string',
            format: 'date-time'
          },
          currentAdvice: {
            type: 'string',
            description: 'AI-generated watering/care advice based on current weather'
          }
        }
      },
      UserPreferences: {
        type: 'object',
        properties: {
          temperatureUnit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            default: 'celsius'
          },
          notificationEnabled: {
            type: 'boolean',
            default: true
          },
          alertThreshold: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            default: 'medium'
          },
          coldTolerance: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            default: 'medium',
            description: 'User sensitivity to cold weather'
          },
          activityPreferences: {
            type: 'array',
            items: { type: 'string' },
            example: ['hiking', 'gardening', 'sports'],
            description: 'User activities for personalized advice'
          }
        }
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                example: 'BAD_REQUEST'
              },
              message: {
                type: 'string',
                example: 'Invalid request parameters'
              },
              details: {
                type: 'object',
                description: 'Additional error details'
              }
            }
          }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Bad Request - Invalid input or parameters',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized - Authentication required or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Not Found - Resource does not exist',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Conflict: {
        description: 'Conflict - Resource already exists',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  }
};
