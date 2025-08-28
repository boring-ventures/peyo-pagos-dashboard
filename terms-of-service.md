# Terms of service

Customers need to agree to Bridge's terms of services (ToS) before we can process KYC / B information.

## **ToS acceptance for a new customer**

For new customer creations, use this endpoint to request a URL and reference our [ToS Links API](/api-reference/customers/request-a-hosted-url-for-tos-acceptance-for-new-customer-creation)

```bash Request
curl --location --request POST 'https://api.bridge.xyz/v0/customers/tos_links' \
--header 'Idempotency-Key: <A unique idempotency key>' \
--header 'Api-Key: <API Key>'
```

```json Response
{
  "url": "https://dashboard.bridge.xyz/accept-terms-of-service?session_token=4d5d8c45-9feb-422a-bb5e-0fd32e3b3c53"
}
```

Use this `url` to guide the customer towards Terms of Service acceptance. You can embed this URL in an iFrame or display in a new browser window. Moreover, you can pass a `redirect_uri` query parameter that will redirect the ToS page back to your application with a `signed_agreement_id` as a query parameter.

## **Acceptance of a new ToS version for an existing customer**

Bridge launched a new version on `4/14/2024`. Its acceptance is required for using the SEPA/Euro services. For an existing customer, a `GET` request can be issued to this endpoint to retrieve a ToS acceptance link to accept the new version.

```bash Request
curl --location --request GET 'https://api.bridge.xyz/v0/customers/cust_123/tos_acceptance_link' \
--header 'Api-Key: <API Key>'
```

```json Response
{
  "url": "https://dashboard.bridge.xyz/accept-terms-of-service?email=sage%40blick-mayer.example&t=74ea7c13-2b52-5073-bd12-6879f92b88dd"
}
```

Use this `url` to guide the customer towards Terms of Service acceptance. You can embed this URL in an iFrame or display in a new browser window. For iFrame and WebView implementations, we recommend listening to the `postMessage` event for the `signedAgreementId`. Moreover, you can pass a `redirect_uri` query parameter that will redirect the TOS page back to your application with a `signed_agreement_id` as a query parameter.

Please reference our [ToS Acceptance Link API](/api-reference/customers/retrieve-a-hosted-url-for-tos-acceptance-for-an-existing-customer) for existing customers for more details.
