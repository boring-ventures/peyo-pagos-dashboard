# Create a customer

## OpenAPI

````yaml https://bridge-docs.readme.io/openapi/65cfb83f5b8a790047b6a7ec post /customers
paths:
  path: /customers
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
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              type:
                allOf:
                  - description: Type of the customer (individual vs. business).
                    type: string
                    minLength: 1
                    enum:
                      - individual
              first_name:
                allOf:
                  - type: string
                    minLength: 2
                    maxLength: 1024
                    description: The first name of the individual.
              middle_name:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
                    description: The middle name of the individual.
              last_name:
                allOf:
                  - type: string
                    minLength: 2
                    maxLength: 1024
                    description: The last name of the individual.
              transliterated_first_name:
                allOf:
                  - type: string
                    description: >-
                      Required when the `first_name` includes any non Latin-1
                      characters. Acceptable characters - Latin-1 Unicode
                      Character Range: À-ÖØ-ßà-öø-ÿ; Standard Unicode Character
                      Range:  -~
                    minLength: 1
                    maxLength: 256
              transliterated_middle_name:
                allOf:
                  - type: string
                    description: >-
                      Required when the `middle_name` includes any non Latin-1
                      characters. Acceptable characters - Latin-1 Unicode
                      Character Range: À-ÖØ-ßà-öø-ÿ; Standard Unicode Character
                      Range:  -~
                    minLength: 1
                    maxLength: 256
              transliterated_last_name:
                allOf:
                  - type: string
                    description: >-
                      Required when the `last_name` includes any non Latin-1
                      characters. Acceptable characters - Latin-1 Unicode
                      Character Range: À-ÖØ-ßà-öø-ÿ; Standard Unicode Character
                      Range:  -~
                    minLength: 1
                    maxLength: 256
              email:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
                    description: The individuals primary email address
              phone:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
                    description: >-
                      The individuals primary phone number in format
                      "+12223334444"
              residential_address:
                allOf:
                  - writeOnly: true
                    $ref: '#/components/schemas/Address2025WinterRefresh'
                    description: >-
                      The residential address of the individual. This must be a
                      physical address, not a PO Box.
              transliterated_residential_address:
                allOf:
                  - writeOnly: true
                    $ref: '#/components/schemas/Address2025WinterRefresh'
                    description: >-
                      Required when any part of the `residential_address`
                      includes any non Latin-1 characters. Acceptable characters
                      - Latin-1 Unicode Character Range: À-ÖØ-ßà-öø-ÿ; Standard
                      Unicode Character Range:  -~
              birth_date:
                allOf:
                  - type: string
                    description: >-
                      Date of birth in format yyyy-mm-dd. Must be at least 18
                      years old.
                    minLength: 10
                    maxLength: 10
              signed_agreement_id:
                allOf:
                  - writeOnly: true
                    type: string
                    description: >
                      The ID of the signed agreement that the customer
                      completed. You can get a signed agreement id for a _new_
                      customer by following this guide
                      [here](https://apidocs.bridge.xyz/docs/terms-of-service#tos-acceptance-for-a-new-customer).
                    minLength: 1
                    maxLength: 1024
              endorsements:
                allOf:
                  - writeOnly: true
                    type: array
                    description: >
                      List of endorsements to request for this customer. If
                      omitted, we'll attempt to grant `base` and `sepa`.


                      _`proof_of_address` document is required for `sepa` to be
                      approved_
                    items:
                      $ref: '#/components/schemas/EndorsementType'
              account_purpose:
                allOf:
                  - type: string
                    description: >
                      What is the primary purpose of the customer's account?


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/individuals)_
                    enum:
                      - charitable_donations
                      - ecommerce_retail_payments
                      - investment_purposes
                      - operating_a_company
                      - other
                      - payments_to_friends_or_family_abroad
                      - personal_or_living_expenses
                      - protect_wealth
                      - purchase_goods_and_services
                      - receive_payment_for_freelancing
                      - receive_salary
              account_purpose_other:
                allOf:
                  - type: string
                    description: |
                      A supplemental description of the `account_purpose`.

                      _Required if the `account_purpose` is `other`._
              employment_status:
                allOf:
                  - type: string
                    description: >
                      What is the customer's current employment status?


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/individuals)_
                    enum:
                      - employed
                      - homemaker
                      - retired
                      - self_employed
                      - student
                      - unemployed
              expected_monthly_payments_usd:
                allOf:
                  - type: string
                    description: >
                      What is the expected monthly volume of payments the
                      customer will be sending or receiving?


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/individuals)_
                    enum:
                      - '0_4999'
                      - '5000_9999'
                      - '10000_49999'
                      - 50000_plus
              acting_as_intermediary:
                allOf:
                  - type: boolean
                    description: >
                      Is the customer acting as an intermediary for a third
                      party?


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/individuals)_
              most_recent_occupation:
                allOf:
                  - type: string
                    description: >
                      What is the customer's most recent occupation? Specify the
                      relevant alphanumeric occupation code. See the [list of
                      occupations](https://apidocs.bridge.xyz/page/sof-eu-most-recent-occupation-list)
                      for the complete list of valid occupations and codes.
                      _Required for Restricted countries._


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/individuals)_
              source_of_funds:
                allOf:
                  - type: string
                    description: >
                      The individuals source of funds, e.g. government_benefits,
                      investments_loans, salary, etc.


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/individuals)_
                    enum:
                      - company_funds
                      - ecommerce_reseller
                      - gambling_proceeds
                      - gifts
                      - government_benefits
                      - inheritance
                      - investments_loans
                      - pension_retirement
                      - salary
                      - sale_of_assets_real_estate
                      - savings
                      - someone_elses_funds
              nationality:
                allOf:
                  - type: string
                    description: >-
                      The ISO 3166-1 (three-character) country code representing
                      the nationality of the customer.
                    writeOnly: true
              verified_govid_at:
                allOf:
                  - type: string
                    description: >-
                      The timestamp for when individual's government ID was
                      successfully verified.
                    writeOnly: true
              verified_selfie_at:
                allOf:
                  - type: string
                    description: >-
                      The timestamp for when individual's selfie was
                      successfully verified.
                    writeOnly: true
              completed_customer_safety_check_at:
                allOf:
                  - type: string
                    description: >-
                      The timestamp for when individual successfully passed
                      customer safety check.
                    writeOnly: true
              identifying_information:
                allOf:
                  - $ref: '#/components/schemas/IdentifyingInformation'
              documents:
                allOf:
                  - $ref: '#/components/schemas/IndividualDocuments'
            required: true
            title: Individual Customer
            refIdentifier: '#/components/schemas/UpdateIndividualCustomerPayload'
            requiredProperties:
              - type
          - type: object
            properties:
              type:
                allOf:
                  - description: Type of the customer (individual vs. business)
                    type: string
                    minLength: 1
                    enum:
                      - business
              business_legal_name:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
                    description: >-
                      The official registered name of the business as documented
                      with government authorities.
              transliterated_business_legal_name:
                allOf:
                  - type: string
                    description: >-
                      Required if `business_legal_name` includes any non Latin-1
                      characters. Acceptable characters - Latin-1 Unicode
                      Character Range: À-ÖØ-ßà-öø-ÿ; Standard Unicode Character
                      Range:  -~
                    minLength: 1
                    maxLength: 1024
              business_trade_name:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
                    description: >-
                      The trading name or DBA (Doing Business As) name under
                      which the business operates publicly.
              transliterated_business_trade_name:
                allOf:
                  - type: string
                    description: >-
                      Required if `business_trade` includes any non Latin-1
                      characters. Acceptable characters - Latin-1 Unicode
                      Character Range: À-ÖØ-ßà-öø-ÿ; Standard Unicode Character
                      Range:  -~
                    minLength: 1
                    maxLength: 1024
              business_description:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
                    description: A brief summary of the business
              email:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
                    description: The business's primary email address
              business_type:
                allOf:
                  - description: How the business is legally registered
                    type: string
                    minLength: 1
                    enum:
                      - cooperative
                      - corporation
                      - llc
                      - other
                      - partnership
                      - sole_prop
                      - trust
              primary_website:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
                    description: >-
                      The business's primary website/web presence. A document
                      with purpose 'proof_of_nature_of_business' is required if
                      this is not provided
              other_websites:
                allOf:
                  - type: array
                    items:
                      type: string
                    minLength: 1
                    maxLength: 1024
                    description: The business's other websites and social media handles
              registered_address:
                allOf:
                  - writeOnly: true
                    $ref: '#/components/schemas/Address2025WinterRefresh'
                    description: The official registered address of the business.
              transliterated_registered_address:
                allOf:
                  - writeOnly: true
                    $ref: '#/components/schemas/Address2025WinterRefresh'
                    description: >-
                      Required if any part of the `registered_address` includes
                      any non Latin-1 characters. Acceptable characters -
                      Latin-1 Unicode Character Range: À-ÖØ-ßà-öø-ÿ; Standard
                      Unicode Character Range:  -~
              physical_address:
                allOf:
                  - writeOnly: true
                    $ref: '#/components/schemas/Address2025WinterRefresh'
                    description: >-
                      The physical address for the primary place of business.
                      This must be a physical address and cannot be a PO Box.
              transliterated_physical_address:
                allOf:
                  - writeOnly: true
                    $ref: '#/components/schemas/Address2025WinterRefresh'
                    description: >-
                      Required if any part of the `physical_address` includes
                      any non Latin-1 characters. Acceptable characters -
                      Latin-1 Unicode Character Range: À-ÖØ-ßà-öø-ÿ; Standard
                      Unicode Character Range:  -~
              signed_agreement_id:
                allOf:
                  - writeOnly: true
                    type: string
                    description: >
                      The ID of the signed agreement that the customer
                      completed. You can get a signed agreement id for a _new_
                      customer by following [this
                      guide](https://apidocs.bridge.xyz/docs/terms-of-service#tos-acceptance-for-a-new-customer).
                    minLength: 1
                    maxLength: 1024
              is_dao:
                allOf:
                  - type: boolean
                    description: >-
                      Whether the business is a DAO (Decentralized Autonomous
                      Organization)
              compliance_screening_explanation:
                allOf:
                  - type: string
                    description: >-
                      Required if `conducts_money_services` is true. A detailed
                      description of the business's compliance and anti-money
                      laundering controls and practices.
                    minLength: 1
                    maxLength: 1024
              associated_persons:
                allOf:
                  - type: array
                    description: >-
                      List of notable people associated with the business such
                      as UBOs.
                    items:
                      $ref: '#/components/schemas/AssociatedPerson'
              endorsements:
                allOf:
                  - writeOnly: true
                    type: array
                    description: >
                      List of endorsements to request for this customer. If
                      omitted, we'll attempt to grant `base` and `sepa`.
                    items:
                      $ref: '#/components/schemas/EndorsementType'
              business_industry:
                allOf:
                  - type: array
                    items:
                      type: string
                    description: >-
                      The industry in which this business operates. Click
                      [here](https://apidocs.bridge.xyz/page/business-industry-list-updated-2022-naics-codes)
                      for the complete list of valid industries and codes.
              publicly_traded_listings:
                allOf:
                  - writeOnly: true
                    type: array
                    description: >-
                      A list of public exchanges that the company is traded on
                      if applicable.
                    items:
                      type: object
                      required:
                        - market_identifier_code
                        - stock_number
                        - ticker
                      properties:
                        market_identifier_code:
                          type: string
                          description: >-
                            The 4-digit Market Identifier Code (MIC) (ISO 10383)
                            for the venue where the business is publicly listed
                            and traded.
                        stock_number:
                          type: string
                          description: >-
                            The 12-digit International Securities Identification
                            Number (ISIN) of the company without dashes (-).
                        ticker:
                          type: string
                          description: >-
                            The ticker for the business's publicly traded
                            listing.
              ownership_threshold:
                allOf:
                  - type: integer
                    description: >-
                      The applicable beneficial ownership threshold for the
                      submitted `associated_persons` information. Valid values
                      are between 5 to 25. Default value is 25.
              has_material_intermediary_ownership:
                allOf:
                  - type: boolean
                    description: >-
                      The business has at least one intermediate legal entity
                      owner with 25% or more ownership
              estimated_annual_revenue_usd:
                allOf:
                  - type: string
                    description: >
                      Estimated annual revenue in USD


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/business-accounts)_
                    enum:
                      - '0_99999'
                      - '100000_999999'
                      - '1000000_9999999'
                      - '10000000_49999999'
                      - '50000000_24999999'
                      - 250000000_plus
              expected_monthly_payments_usd:
                allOf:
                  - type: integer
                    description: >
                      Expected monthly payments in USD


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/business-accounts)_
              operates_in_prohibited_countries:
                allOf:
                  - type: boolean
                    description: >
                      Does the business operate in any prohibited countries?


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/business-accounts)_
              account_purpose:
                allOf:
                  - type: string
                    description: What is the primary purpose of the business account?
                    enum:
                      - charitable_donations
                      - ecommerce_retail_payments
                      - investment_purposes
                      - other
                      - payments_to_friends_or_family_abroad
                      - payroll
                      - personal_or_living_expenses
                      - protect_wealth
                      - purchase_goods_and_services
                      - receive_payments_for_goods_and_services
                      - tax_optimization
                      - third_party_money_transmission
                      - treasury_management
              account_purpose_other:
                allOf:
                  - type: string
                    description: Required if the primary purpose is 'other'.
              high_risk_activities_explanation:
                allOf:
                  - type: string
                    description: >
                      An explanation of the high risk activities that the
                      business performs. 


                      _Required if `high_risk_activities` contains entries other
                      than `none_of_the_above`_
              high_risk_activities:
                allOf:
                  - type: array
                    description: >
                      List of high-risk activities the business is involved in.


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/business-accounts)_
                    items:
                      type: string
                      enum:
                        - adult_entertainment
                        - gambling
                        - hold_client_funds
                        - investment_services
                        - lending_banking
                        - marijuana_or_related_services
                        - money_services
                        - nicotine_tobacco_or_related_services
                        - >-
                          operate_foreign_exchange_virtual_currencies_brokerage_otc
                        - pharmaceuticals
                        - precious_metals_precious_stones_jewelry
                        - safe_deposit_box_rentals
                        - third_party_payment_processing
                        - weapons_firearms_and_explosives
                        - none_of_the_above
              source_of_funds:
                allOf:
                  - type: string
                    description: >-
                      The source of funds for the business, e.g. profits,
                      income, venture capital, etc.
                    enum:
                      - business_loans
                      - grants
                      - inter_company_funds
                      - investment_proceeds
                      - legal_settlement
                      - owners_capital
                      - pension_retirement
                      - sale_of_assets
                      - sales_of_goods_and_services
                      - tax_refund
                      - third_party_funds
                      - treasury_reserves
              source_of_funds_description:
                allOf:
                  - type: string
                    description: >
                      Description of the source of funds for the business'
                      account.


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/business-accounts)_
              conducts_money_services:
                allOf:
                  - type: boolean
                    description: >
                      The business offers money services, investment products,
                      and/or other financial services.


                      _Required for high risk customers. More information found
                      [here](https://apidocs.bridge.xyz/docs/business-accounts)_
              conducts_money_services_using_bridge:
                allOf:
                  - type: boolean
                    description: >
                      The business plans to conduct money services, investment
                      products, and/or other financial services using its Bridge
                      account. A document with purpose 'flow_of_funds' is
                      required if this is true.


                      _Required if `conducts_money_services` is true_
              conducts_money_services_description:
                allOf:
                  - type: string
                    description: |
                      Description of the money services offered by the business.

                      _Required if `conducts_money_services` is true_
              identifying_information:
                allOf:
                  - $ref: '#/components/schemas/IdentifyingInformation'
              documents:
                allOf:
                  - $ref: '#/components/schemas/BusinessDocuments'
              regulated_activity:
                allOf:
                  - type: object
                    required:
                      - regulated_activities_description
                      - primary_regulatory_authority_country
                      - primary_regulatory_authority_name
                      - license_number
                    properties:
                      regulated_activities_description:
                        type: string
                        description: >-
                          A detailed description of the regulated activities the
                          business is licensed to conduct.
                      primary_regulatory_authority_country:
                        type: string
                        description: The ISO 3166-1 (three-character) country code.
                      primary_regulatory_authority_name:
                        type: string
                        description: >-
                          The name of the primary regulatory authority that
                          oversees the business's regulated activities.
                      license_number:
                        type: string
                        description: >-
                          The license number or registration number assigned by
                          the business's primary regulator.
            required: true
            title: Business Customer
            refIdentifier: '#/components/schemas/UpdateBusinessCustomerPayload'
            requiredProperties:
              - type
              - business_legal_name
              - business_trade_name
              - business_description
              - email
              - business_type
              - business_industry
              - registered_address
              - physical_address
              - signed_agreement_id
              - is_dao
              - associated_persons
              - identifying_information
              - documents
              - has_material_intermediary_ownership
              - account_purpose
              - source_of_funds
        examples:
          example:
            value:
              type: individual
              first_name: <string>
              middle_name: <string>
              last_name: <string>
              transliterated_first_name: <string>
              transliterated_middle_name: <string>
              transliterated_last_name: <string>
              email: <string>
              phone: <string>
              residential_address:
                street_line_1: <string>
                street_line_2: <string>
                city: <string>
                subdivision: <string>
                postal_code: <string>
                country: <string>
              transliterated_residential_address:
                street_line_1: <string>
                street_line_2: <string>
                city: <string>
                subdivision: <string>
                postal_code: <string>
                country: <string>
              birth_date: <string>
              signed_agreement_id: <string>
              endorsements:
                - base
              account_purpose: charitable_donations
              account_purpose_other: <string>
              employment_status: employed
              expected_monthly_payments_usd: '0_4999'
              acting_as_intermediary: true
              most_recent_occupation: <string>
              source_of_funds: company_funds
              nationality: <string>
              verified_govid_at: <string>
              verified_selfie_at: <string>
              completed_customer_safety_check_at: <string>
              identifying_information:
                - type: drivers_license
                  issuing_country: <string>
                  number: <string>
                  description: <string>
                  expiration: <string>
                  image_front: <string>
                  image_back: <string>
              documents:
                - purposes:
                    - proof_of_account_purpose
                  file: <string>
                  description: <string>
        description: >
          Customer object to be created.


          For individual customers (soon to be businesses as well), no fields
          are strictly required by the API. For example, it is valid to create a
          customer without a first name, last name, or residential address, but
          this customer will not be granted endorsements required to transact on
          Bridge until the necessary information is provided, possibly via a PUT
          request.
  response:
    '201':
      application/json:
        schemaArray:
          - type: object
            properties:
              id:
                allOf:
                  - $ref: '#/components/schemas/Id'
                    readOnly: true
              first_name:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
              last_name:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
              email:
                allOf:
                  - type: string
                    minLength: 1
                    maxLength: 1024
              status:
                allOf:
                  - type: string
                    $ref: '#/components/schemas/CustomerStatus'
              capabilities:
                allOf:
                  - type: object
                    properties:
                      payin_crypto:
                        type: string
                        $ref: '#/components/schemas/CustomerCapabilityState'
                      payout_crypto:
                        type: string
                        $ref: '#/components/schemas/CustomerCapabilityState'
                      payin_fiat:
                        type: string
                        $ref: '#/components/schemas/CustomerCapabilityState'
                      payout_fiat:
                        type: string
                        $ref: '#/components/schemas/CustomerCapabilityState'
              future_requirements_due:
                allOf:
                  - readOnly: true
                    description: >-
                      Information about requirements that may be needed in the
                      future for the customer (eg. enhanced KYC checks for high
                      volume transactions etc.). Please consult our KYC guide on
                      how to resolve each requirement.
                    type: array
                    minItems: 0
                    items:
                      type: string
                      enum:
                        - id_verification
              requirements_due:
                allOf:
                  - readOnly: true
                    description: >-
                      KYC requirements still needed to be completed. Please
                      consult our KYC guide on how to resolve each requirement.
                    type: array
                    minItems: 0
                    items:
                      type: string
                      enum:
                        - external_account
                        - id_verification
              created_at:
                allOf:
                  - readOnly: true
                    type: string
                    description: Time of creation of the customer
                    format: date-time
              updated_at:
                allOf:
                  - readOnly: true
                    type: string
                    description: Time of last update of the customer
                    format: date-time
              rejection_reasons:
                allOf:
                  - readOnly: true
                    description: Reasons why a customer KYC was rejected
                    type: array
                    minItems: 0
                    items:
                      $ref: '#/components/schemas/RejectionReason'
              has_accepted_terms_of_service:
                allOf:
                  - readOnly: true
                    description: Whether the customer has accepted the terms of service.
                    type: boolean
              endorsements:
                allOf:
                  - readOnly: true
                    description: >-
                      A summary of whether the customer has received approvals
                      to complete onboarding or use certain products/services
                      offered by Bridge.
                    type: array
                    minItems: 0
                    items:
                      $ref: '#/components/schemas/Endorsement'
            refIdentifier: '#/components/schemas/Customer'
        examples:
          IndividualCustomerCreated:
            summary: Customer successfully created
            value:
              id: cust_ind
              first_name: John
              last_name: Doe
              email: johndoe@johndoe.com
              status: active
              type: individual
              has_accepted_terms_of_service: true
              address:
                street_line_1: 123 Washington St
                street_line_2: Apt 2F
                city: New York
                postal_code: '10001'
                state: NY
                country: USA
              rejection_reasons: []
              requirements_due:
                - external_account
              future_requirements_due:
                - id_verification
              endorsements:
                - name: base
                  status: approved
                - name: sepa
                  status: incomplete
                  additional_requirements:
                    - kyc_with_proof_of_address
                    - tos_v2_acceptance
              created_at: '2020-01-01T00:00:00.000Z'
              updated_at: '2020-01-02T00:00:00.000Z'
          BusinessCustomerCreated:
            summary: Customer successfully created
            value:
              id: cust_biz
              first_name: Biz Corp
              last_name: _
              status: active
              type: individual
              email: harperstern@harperstern.com
              has_accepted_terms_of_service: true
              address:
                street_line_1: 1 5th avenue
                city: New York
                state: NY
                postal_code: '10010'
                country: USA
              rejection_reasons: []
              requirements_due:
                - external_account
              future_requirements_due:
                - id_verification
              endorsements:
                - name: base
                  status: approved
                - name: sepa
                  status: approved
              beneficial_owners:
                - id: bo_1
                  email: bo_1@bizcorp.com
                - id: bo_2
                  email: bo_2@bizcorp.com
              created_at: '2020-01-01T00:00:00.000Z'
              updated_at: '2020-01-02T00:00:00.000Z'
        description: Customer object created
    '400':
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
          BadCustomerRequestErrorExample:
            summary: Bad customer request
            value:
              code: bad_customer_request
              message: fields missing from customer body.
              name: first_name,ssn
        description: Request containing missing or invalid parameters.
    '401':
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
  schemas:
    Id:
      description: A UUID that uniquely identifies a resource
      type: string
      pattern: '[a-z0-9]*'
      minLength: 1
      maxLength: 42
    Endorsement:
      required:
        - name
        - status
      properties:
        name:
          description: The endorsement type.
          $ref: '#/components/schemas/EndorsementType'
        status:
          type: string
          enum:
            - incomplete
            - approved
            - revoked
        additional_requirements:
          description: >-
            Additional requirements that need to be completed for obtaining the
            approval for the endorsement. 


            1. `kyc_approval` and `tos_acceptance` are required for the `base`
            endorsement. 

            2. `kyc_with_proof_of_address` and `tos_v2_acceptance` are required
            for `sepa`. If `tos_v2_acceptance` is not completed, a ToS
            acceptance link can be retrieved for the current customer from the
            endpoint `/v0/customers/{customerID}/tos_acceptance_link`. To
            fulfill the `kyc_with_proof_of_address` requirement, a KYC link can
            be specifically requested for the current customer via the endpoint
            `/v0/customers/{customerID}/kyc_link`, with `endorsement=sepa`
            included in the query string
          type: array
          minItems: 0
          items:
            $ref: '#/components/schemas/EndorsementRequirementEnum'
        requirements:
          description: >
            This object aims to replace the `additional_requirements` attribute
            as it gives a more comprehensive view into what items are already
            `complete` or `pending` and which are `missing` or have `issues`.
          type: object
          required:
            - complete
            - pending
            - missing
            - issues
          properties:
            complete:
              type: array
              description: >-
                an array of requirements that have already been completed for
                this endorsement.
              minItems: 0
              items:
                type: string
            pending:
              type: array
              description: >-
                an array of requirements that are pending review for this
                endorsement.
              minItems: 0
              items:
                type: string
            missing:
              type: object
              description: >-
                an object that will specify an indepth breakdown of what items
                are missing for this endorsement.
            issues:
              type: array
              description: >
                An array of issues preventing this endorsement from being
                approved. Values in this array can be either a string such as
                `endorsement_not_available_in_customers_region` or an object
                that correlates the issue to a particular field such as `{
                id_front_photo: "id_expired" }`
              minItems: 0
              items:
                oneOf:
                  - type: string
                  - type: object
    EndorsementRequirementEnum:
      type: string
      enum:
        - kyc_approval
        - tos_acceptance
        - kyc_with_proof_of_address
        - tos_v2_acceptance
    EndorsementType:
      description: The type of endorsement.
      type: string
      enum:
        - base
        - sepa
        - spei
        - cards
    Address2025WinterRefresh:
      required:
        - street_line_1
        - country
        - city
      properties:
        street_line_1:
          type: string
          minLength: 4
        street_line_2:
          type: string
          minLength: 1
        city:
          type: string
          minLength: 1
        subdivision:
          type: string
          description: ISO 3166-2 subdivision code. Must be supplied for US addresses.
          minLength: 1
          maxLength: 3
        postal_code:
          type: string
          description: Must be supplied for countries that use postal codes.
          minLength: 1
        country:
          description: Three-letter alpha-3 country code as defined in the ISO 3166-1 spec.
          type: string
          minLength: 3
          maxLength: 3
    IdentifyingInformation:
      writeOnly: true
      type: array
      title: Identification Information
      items:
        type: object
        required:
          - issuing_country
          - type
        properties:
          type:
            type: string
            description: >
              The `type` provided determines whether you are submitting a tax
              identification number or some form of government-issued ID.


              Reference these lists for tax identification numbers by country:
              [Individuals](https://apidocs.bridge.xyz/docs/individual-tax-identification-numbers-by-country),
              [Businesses](https://apidocs.bridge.xyz/docs/business-tax-identification-numbers-by-country)


              Here is the list of acceptable government issued id documents:
              `drivers_license`, `matriculate_id`, `military_id`,
              `permanent_residency_id`, `state_or_provincial_id`, `visa`,
              `national_id`, `passport`


              All customers must provide at least one Tax Identification Number
              for their issuing country. If a country cannot be found, please
              select `other` and ensure the `description` field is provided.


              Non-U.S. `individual` customers and associated persons must
              include a combination of at least one Tax Identification Number
              and at least one photo id document such as a `passport` (with
              `image_front`) or a government-issued `drivers_license`.
            enum:
              - drivers_license
              - matriculate_id
              - military_id
              - national_id
              - passport
              - permanent_residency_id
              - state_or_provincial_id
              - visa
              - abn
              - acn
              - ahv
              - ak
              - aom
              - arbn
              - avs
              - bc
              - bce
              - bin
              - bir
              - bp
              - brn
              - bsn
              - bvn
              - cc
              - cdi
              - cedula_juridica
              - cf
              - cif
              - cin
              - cipc
              - cn
              - cnp
              - cnpj
              - cpf
              - cpr
              - crc
              - crib
              - crn
              - cro
              - cui
              - cuil
              - curp
              - cuit
              - cvr
              - edrpou
              - ein
              - embg
              - emirates_id
              - en
              - fin
              - fn
              - gstin
              - gui
              - hetu
              - hkid
              - hn
              - ic
              - ico
              - id
              - id_broj
              - idno
              - idnp
              - idnr
              - if
              - iin
              - ik
              - inn
              - ird
              - itin
              - itr
              - iva
              - jmbg
              - kbo
              - kvk
              - matricule
              - mf
              - mn
              - ms
              - mst
              - nic
              - nicn
              - nie
              - nif
              - nin
              - nino
              - nip
              - nipc
              - nipt
              - nit
              - npwp
              - nric
              - nrn
              - nrt
              - ntn
              - nuit
              - nzbn
              - oib
              - org
              - other
              - pan
              - partita_iva
              - pesel
              - pib
              - pin
              - pk
              - ppsn
              - qid
              - rc
              - regon
              - rfc
              - ricn
              - rif
              - rn
              - rnc
              - rnokpp
              - rp
              - rrn
              - rtn
              - ruc
              - rut
              - si
              - sin
              - siren
              - siret
              - spi
              - ssm
              - ssn
              - steuer_id
              - strn
              - tckn
              - tfn
              - tin
              - tpin
              - trn
              - ucn
              - uen
              - uic
              - uid
              - usc
              - ust_idnr
              - utr
              - vat
              - vkn
              - voen
              - y_tunnus
          issuing_country:
            type: string
            description: >-
              The ISO 3166-1 (three-character) country code that issued the
              provided document.
          number:
            type: string
            description: >-
              The unique identifier of the document. Required if this document
              is being used as a tax identification number (e.g., you are
              providing a passport or national_id with no other identification).
          description:
            type: string
            description: >-
              A description describing the provided document. This field is
              required when `other` is selected.
          expiration:
            type: string
            description: The expiration date of the given document in yyyy-mm-dd format.
          image_front:
            type: string
            description: >
              This field is optionally accepted for tax_id types, but required
              for government_id types. Base64 encoded image* of the front side
              of the provided document, following the data-uri scheme i.e.
              data:image/[type];base64,[base_64_encoded_file_contents], with a
              minimum size of 200px x 200px \n\n*Maximum File Size:
              15MB\n\n*Valid file types: .pdf, .jpeg, .jpg, .png, .heic, .tif


              _Note: When combined with an `image_back`, the combined size of
              both images must not exceed 24MB._
          image_back:
            type: string
            description: >
              Base64 encoded image* of the back side of the provided document,
              following the data-uri scheme i.e.
              data:image/[type];base64,[base_64_encoded_file_contents], with a
              minimum size of 200px x 200px \n\n*Maximum File Size:
              15MB\n\n*Valid file types: .pdf, .jpeg, .jpg, .png, .heic, .tif


              _Note: When combined with an `image_front`, the combined size of
              both images must not exceed 24MB._
    IndividualDocuments:
      writeOnly: true
      type: array
      title: Documents
      description: Please click "ADD OBJECT" for more information.
      items:
        type: object
        required:
          - purposes
          - file
        properties:
          purposes:
            type: array
            items:
              type: string
              enum:
                - proof_of_account_purpose
                - proof_of_address
                - proof_of_individual_name_change
                - proof_of_relationship
                - proof_of_source_of_funds
                - proof_of_source_of_wealth
                - proof_of_tax_identification
                - other
            description: >-
              A list of purposes that the given document serves. Click "ADD
              STRING" to see common document purposes for individuals, or view
              the full list of possible values
              [here](https://apidocs.bridge.xyz/docs/supported-documents).
          file:
            type: string
            description: >-
              Base64 encoded image* of the provided document, following the
              data-uri scheme i.e.
              data:image/[type];base64,[base_64_encoded_file_contents], with a
              minimum size of 200px x 200px 


              *Maximum File Size: 24MB


              *Valid file types: .pdf, .jpeg, .jpg, .png, .heic, .tif
          description:
            type: string
            description: >-
              A description describing the provided document. This field is
              required when `other` is provided as one of the purposes.
    BusinessDocuments:
      writeOnly: true
      type: array
      title: Documents
      description: Please click "ADD OBJECT" for more information.
      items:
        type: object
        required:
          - purposes
          - file
        properties:
          purposes:
            type: array
            items:
              type: string
              enum:
                - aml_comfort_letter
                - business_formation
                - directors_registry
                - e_signature_certificate
                - evidence_of_good_standing
                - flow_of_funds
                - formation_document
                - marketing_materials
                - ownership_chart
                - ownership_information
                - proof_of_account_purpose
                - proof_of_address
                - proof_of_entity_name_change
                - proof_of_nature_of_business
                - proof_of_signatory_authority
                - proof_of_source_of_funds
                - proof_of_source_of_wealth
                - proof_of_tax_identification
                - shareholder_register
                - other
            description: >
              A list of purposes that the given document serves. Click "ADD
              STRING" to see common document purposes for businesses, or view
              the full list of possible values
              [here](https://apidocs.bridge.xyz/docs/supported-documents).


              `business_formation` and `ownership_information` documents are
              required for businesses.
          file:
            type: string
            description: >-
              Base64 encoded image of the provided document, following the
              data-uri scheme i.e.
              data:image/[type];base64,[base_64_encoded_file_contents], with a
              minimum size of 200px x 200px 


              *Maximum File Size: 24MB


              *Valid file types: .pdf, .jpeg, .jpg, .png, .heic, .tif
          description:
            type: string
            description: >-
              A description describing the provided document. This field is
              required when `other` is provided as one of the purposes.
    AssociatedPerson:
      required:
        - first_name
        - last_name
        - email
        - residential_address
        - identifying_information
        - birth_date
        - has_ownership
        - has_control
        - is_signer
        - relationship_established_at
      properties:
        first_name:
          type: string
          minLength: 1
          maxLength: 1024
          description: The first name of the associated person
        middle_name:
          type: string
          minLength: 1
          maxLength: 1024
          description: The middle name of the associated person
        last_name:
          type: string
          minLength: 2
          maxLength: 1024
          description: The last name of the associated person
        transliterated_first_name:
          type: string
          description: >-
            Required when the `first_name` includes any non Latin-1 characters.
            Acceptable characters - Latin-1 Unicode Character Range:
            À-ÖØ-ßà-öø-ÿ; Standard Unicode Character Range:  -~
          minLength: 1
          maxLength: 256
        transliterated_middle_name:
          type: string
          description: >-
            Required when the `middle_name` includes any non Latin-1 characters.
            Acceptable characters - Latin-1 Unicode Character Range:
            À-ÖØ-ßà-öø-ÿ; Standard Unicode Character Range:  -~
          minLength: 1
          maxLength: 256
        transliterated_last_name:
          type: string
          description: >-
            Required when the `last_name` includes any non Latin-1 characters.
            Acceptable characters - Latin-1 Unicode Character Range:
            À-ÖØ-ßà-öø-ÿ; Standard Unicode Character Range:  -~
          minLength: 1
          maxLength: 256
        email:
          type: string
          minLength: 1
          maxLength: 1024
          description: The persons primary email address
        phone:
          description: The persons phone in format "+12223334444"
          type: string
          minLength: 1
          maxLength: 1024
        residential_address:
          writeOnly: true
          $ref: '#/components/schemas/Address2025WinterRefresh'
          description: >-
            The residential address of the associated person. This must be a
            physical address and cannot be a PO Box.
        transliterated_residential_address:
          writeOnly: true
          $ref: '#/components/schemas/Address2025WinterRefresh'
          description: >-
            Required when any part of the `residential_address` includes any non
            Latin-1 characters. Acceptable characters - Latin-1 Unicode
            Character Range: À-ÖØ-ßà-öø-ÿ; Standard Unicode Character Range:  -~
        birth_date:
          type: string
          description: Date of birth in format yyyy-mm-dd. Must be at least 18 years old.
          minLength: 10
          maxLength: 10
        has_ownership:
          type: boolean
          description: True if this person has at least 25% ownership of the business.
        has_control:
          type: boolean
          description: >-
            True if this is the control person of the company, having
            significant responsibility to control, manage or influence the
            activities of the business entity. At least one control person must
            be specified. 
        is_signer:
          type: boolean
          description: >-
            True if this person is able to authorize transactions on behalf of
            the business. At least one signer must be specified.
        is_director:
          type: boolean
          description: True if this person is an appointed director of the company.
        title:
          type: string
          description: >-
            The title of this beneficial owner at the company, e.g. CEO, CFO,
            etc. Required if has_control is true.
          minLength: 1
          maxLength: 1024
        ownership_percentage:
          type: integer
          description: Ultimate ownership percentage of the business.
          writeOnly: true
        attested_ownership_structure_at:
          type: string
          description: >-
            The date or timestamp when this individual attested to the
            correctness of the ownership structure provided to Bridge. If
            provided by at least one control person, ownership documents for the
            business are not required.
          writeOnly: true
        relationship_established_at:
          type: string
          description: >-
            The date or timestamp when the beneficial owner relationship was
            established in format yyyy-mm-dd.
        verified_govid_at:
          type: string
          description: >-
            The date or timestamp for when individual's government ID was
            successfully verified.
          writeOnly: true
        verified_selfie_at:
          type: string
          description: >-
            The date or timestamp for when individual's selfie was successfully
            verified.
          writeOnly: true
        completed_customer_safety_check_at:
          type: string
          description: >-
            The date or timestamp for when individual successfully passed
            customer safety check.
          writeOnly: true
        identifying_information:
          $ref: '#/components/schemas/IdentifyingInformation'
        documents:
          $ref: '#/components/schemas/IndividualDocuments'
    CustomerStatus:
      type: string
      description: >
        `offboarded`: represents a customer's account that was internally
        reviewed and closed due to suspicious activity.

        `paused`: represents a customer's account that is currently under review
        because of activity on the platform.
      enum:
        - active
        - awaiting_questionnaire
        - awaiting_ubo
        - incomplete
        - not_started
        - offboarded
        - paused
        - rejected
        - under_review
    CustomerCapabilityState:
      type: string
      description: State of the customer capability
      enum:
        - pending
        - active
        - inactive
        - rejected
    RejectionReason:
      description: Reason why the kyc_status was rejected
      properties:
        developer_reason:
          type: string
          description: >-
            Developer information for why a customer was rejected. Not to be
            shared with the customer.
        reason:
          type: string
          description: >-
            Reason for why a customer was rejected. To be shared with the
            customer.
        created_at:
          type: string
          description: Time of creation of the rejection reason

````