import AWS = require('aws-sdk');
import { IDragon } from '../interfaces/dragon';

const tableName = process.env.TABLE_NAME || '';
const dynamo = new AWS.DynamoDB.DocumentClient();

const createResponse = (body: string | AWS.DynamoDB.DocumentClient.ItemList, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
    },
    body: JSON.stringify(body, null, 2),
  };
};

const getAllDragons = async () => {
  const scanResult = await dynamo.scan({ TableName: tableName }).promise();
  return scanResult;
};

const addDragonItem = async (data: IDragon) => {
  if (data) await dynamo.put({ TableName: tableName, Item: data }).promise();
  return data;
};

const deleteDragonItem = async (data: { dragon_name: string }) => {
  const { dragon_name } = data;
  if (dragon_name) await dynamo.delete({ TableName: tableName, Key: { dragon_name } }).promise();
  return dragon_name;
};

exports.handler = async function (event: AWSLambda.APIGatewayEvent) {
  try {
    const { httpMethod, body: requestBody } = event;

    if (httpMethod === 'OPTIONS') {
      return createResponse('Ok');
    }

    if (httpMethod === 'GET') {
      const response = await getAllDragons();
      return createResponse(response.Items || []);
    }

    if (!requestBody) {
      return createResponse('Missing request body', 500);
    }

    const data = JSON.parse(requestBody);

    if (httpMethod === 'POST') {
      const dragon = await addDragonItem(data);
      return dragon
        ? createResponse(`${JSON.stringify(data)} added to the database`)
        : createResponse('Dragon is missing', 500);
    }

    if (httpMethod === 'DELETE') {
      const dragon = await deleteDragonItem(data);
      return dragon
        ? createResponse(`${JSON.stringify(data)} deleted from the database`)
        : createResponse('Dragon is missing', 500);
    }

    return createResponse(`Ops, something wrong!`, 500);
  } catch (error) {
    console.log(error);
    return createResponse(error, 500);
  }
};
