# Request a hosted URL for ToS acceptance for new customer creation

> The URL endpoint returned will guide the user through a Bridge TOS flow. Signing this acceptance flow is a requirement for creating customers.

## OpenAPI

````yaml https://bridge-docs.readme.io/openapi/65cfb83f5b8a790047b6a7ec post /customers/tos_links
paths:
  path: /customers/tos_links
  method: post
  servers:
    - url: https://api.bridge.xyz/v0
      description: The base path for all resources
  request:
    security:
      - title: ApiKey
        parameters:
          query: {}
          header:
            Api-Key:
              type: apiKey
          cookie: {}
    parameters:
      path: {}
      query: {}
      header:
        Idempotency-Key:
          schema:
            - type: string
              required: true
      cookie: {}
    body: {}
  response:
    '201':
      application/json:
        schemaArray:
          - type: object
            properties:
              url:
                allOf:
                  - type: string
                    description: >-
                      A Bridge hosted URL for users to complete terms of service
                      signing.
            requiredProperties:
              - url
        examples:
          TosUrl:
            summary: A sample Bridge hosted URL
            value:
              data:
                url: >-
                  https://dashboard.bridge.xyz/accept-terms-of-service?session_token=4d5d8c45-9feb-422a-bb5e-0fd32e3b3c53&redirect_uri=https%3A%2F%2Fgoogle.com
        description: A Bridge hosted URL for users to complete terms of service signing.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              code:
                allOf:
                  - &ref_0
                    type: string
                    minLength: 1
                    maxLength: 256
              message:
                allOf:
                  - &ref_1
                    type: string
                    minLength: 1
                    maxLength: 512
              source:
                allOf:
                  - &ref_2
                    title: ErrorSource
                    required:
                      - location
                      - key
                    properties:
                      location:
                        type: string
                        enum:
                          - path
                          - query
                          - body
                          - header
                      key:
                        type: string
                        description: >-
                          Comma separated names of the properties or parameters
                          causing the error
            refIdentifier: '#/components/schemas/Error'
            requiredProperties: &ref_3
              - code
              - message
        examples:
          MissingTokenError:
            summary: No Api-Key header
            description: The header may be missing or misspelled.
            value:
              code: required
              location: header
              name: Api-Key
              message: Missing Api-Key header
          InvalidTokenError:
            summary: Invalid key in Api-Key header
            value:
              code: invalid
              location: header
              name: Api-Key
              message: Invalid Api-Key header
        description: Missing or invalid API key
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              code:
                allOf:
                  - *ref_0
              message:
                allOf:
                  - *ref_1
              source:
                allOf:
                  - *ref_2
            refIdentifier: '#/components/schemas/Error'
            requiredProperties: *ref_3
        examples:
          UnexpectedError:
            summary: An unexpected error
            value:
              errors:
                - code: unexpected
                  message: An expected error occurred, you may try again later
        description: Unexpected error. User may try and send the request again.
  deprecated: false
  type: path
components:
  schemas: {}

````