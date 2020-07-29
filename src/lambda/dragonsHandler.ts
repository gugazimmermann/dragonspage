import AWS = require('aws-sdk');

const tableName = process.env.TABLE_NAME || '';
const PK = process.env.PK || '';
const dynamo = new AWS.DynamoDB.DocumentClient();

const createResponse = (
  body: string | [AWS.DynamoDB.DocumentClient.AttributeMap | undefined] | AWS.DynamoDB.DocumentClient.ItemList,
  statusCode = 200,
) => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
    },
    body: JSON.stringify(body, null, 2),
  };
};

const getOne = async (pathParameters: { [x: string]: string }) => {
  const value = pathParameters.proxy;
  const primaryKey = JSON.parse(PK);
  const params = { TableName: tableName, Key: { [primaryKey.name]: value } };
  return await dynamo.get(params).promise();
};

const getAll = async () => {
  return await dynamo.scan({ TableName: tableName }).promise();
};

exports.handler = async function (event: AWSLambda.APIGatewayEvent) {
  try {
    const { httpMethod, pathParameters } = event;
    if (httpMethod === 'OPTIONS') {
      return createResponse('Ok');
    }
    if (httpMethod === 'GET') {
      if (!pathParameters) {
        const response = await getAll();
        return createResponse(response.Items || []);
      }
      const response = await getOne(pathParameters);
      return createResponse([response.Item] || []);
    }
    return createResponse(`Ops, something wrong!`, 500);
  } catch (error) {
    console.log(error);
    return createResponse(error, 500);
  }
};
