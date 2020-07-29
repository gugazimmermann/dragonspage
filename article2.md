# DRAGONS PAGE

## WebSite using DynamoDB created with AWS-CDK - Part 2

> In this part we will continue Part 1, creating more tables, adding a lot of data, show all the dragons on the website, search for just the one that we need, and see how to solve a lot of issues that can appear during the development.

> In the end, we will have a Bonus part, to show to do use a custom URL for the website and API endpoint.

RUNNING CODE: https://www.pocz.io/

LINKEDIN: 

**DRAGONS PAGE** changes the exercises of the course **Amazon DynamoDB: Building NoSQL Database-Driven Applications** https://www.coursera.org/learn/dynamodb-nosql-database-driven-apps/home/welcome to be done using the AWS CDK. Thanks to Seph Robinson, Morgan Willis, and Rick H for the course. (I also recommend the specialization AWS Fundamentals: Going Cloud-Native that I did before.)

> This will help you to learn how to develop using the AWS Cloud Development Kit (AWS CDK).

## Story Continued:

*"After Part-1 (https://github.com/gugazimmermann/dragonspage/tree/part-1) we have a proof of concept website that displays dragon cards using data stored in DynamoDB. The website communicates with your API Gateway backend, and currently returns everything in the database.*

*This is fine for a proof of concept, and when you call Mary and show her the website she is very happy with what we are doing. She tells you that she already has come up with an idea for a card template and asks if you can integrate that too? You say no problem, and ask her to email it to you along with the JSON files for all the dragon data that she has been promising you all week.*

*She apologizes for the delay and tells you, you will have it in the next 5 minutes via email. 38 minutes later, you get the email. Your head sinks into your hands, as you see that she has a much more complex data requirement than the one you envisioned.*

*It is a relational data structure with dragons of different types, having different skills and modifiers. Essentially she has given you all the data that would be required for an actual game engine. You are not building the game engine. She has other people lined up for that, thank goodness.*

*However, she still wants you to use DynamoDB to store this data for her, and leverage that to display card data on the website. You already know how to upload one item at a time with code, but that isn't feasible with the amount of data she has given you. You need to come up with a script that can upload multiple items to multiple tables.*

#### Before we start

Do not forgot to run `npm run watch` in the terminal to handle the .ts files.
You can `cdk destroy` the part-1 stack.
 
## Create multiple DynamoDB

So we decided to create multiple DynamoDB tables to store the JSON data that Mary sent to us, and since the code will be more complex, We can start splitting the code and create some CDK Constructs. Now all the code lives inside `lib/dragonspage-stack.ts`, so we can create `lib/dragons-backend.ts` to have the DynamoDB tables, Lambdas, and APIs.

```
import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';

export class DragonsBackend extends cdk.Construct {
  public readonly handler: lambda.Function;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const dragonsTable = new dynamodb.Table(this, 'dragons', {
      partitionKey: { name: 'dragon_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dragonsHandler = new lambda.Function(this, 'DragonsHandler', {
      code: lambda.Code.fromAsset('src/lambda'),
      handler: 'dragonsHandler.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: dragonsTable.tableName,
      },
    });

    dragonsTable.grantReadWriteData(dragonsHandler);

    new apigateway.LambdaRestApi(this, 'DragonsEndpoint', {
      handler: dragonsHandler,
    });
  }
}


```

The file `lib/dragons-frontend.ts` will take care of the S3 bucket and deployment of the website.

```
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';

export class DragonsFrontend extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const drangonsWebsiteBucket = new s3.Bucket(this, 'DrangonsWebsiteBucket', {
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
    });

    new s3Deployment.BucketDeployment(this, 'DeployDrangonsWebsite', {
      destinationBucket: drangonsWebsiteBucket,
      sources: [s3Deployment.Source.asset('frontend/build')],
    });

    new cdk.CfnOutput(this, 'DrangonsWebsiteURL', {
      value: drangonsWebsiteBucket.bucketWebsiteUrl,
    });
  }
}

```

and `lib/dragonspage-stack.ts` will put both toghter.

```
import * as cdk from '@aws-cdk/core';
import { DragonsBackend } from './dragons-backend';
import { DragonsFrontend } from './dragons-frontend';

export class DragonspageStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DragonsBackend(this, 'DragonsBackend');
    new DragonsFrontend(this, 'DragonsFrontend');
  }
}
```

We can deploy… but this code has a lot of issues. First is that every time we deploy the code it will upload the react website to the bucket and this is not necessary, we just need to deploy the website after making some change on it… and if for some reason we don't have the build folder, the deploy will fail.

Another problem is if the API Endpoint changes after the deploy, the website will stop work, and to fix we will need to change the API Endpoint inside the code, build the react, and then deploy everything again!

How we can fix it? We can split into two stacks, one for the backend and another for the frontend.

Delete everything inside `lib/`, we don't need it anymore. We can also stop the `npm run watch` for now, because for sure will show a lot of errors.

Then create the file `lib/dragons-backend-stack.ts`:

```
import * as cdk from '@aws-cdk/core';
import { DragonsBackend } from './dragons-backend';

export class DragonsBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DragonsBackend(this, 'DragonsBackend');
  }
}

```

And `lib/dragons-frontend-stack.ts`

```
import * as cdk from '@aws-cdk/core';
import { DragonsFrontend } from './dragons-frontend';

export class DragonsFrontendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DragonsFrontend(this, 'DragonsFrontend');
  }
}

```

Change `bin/dragonspage.ts` (the entry point of the CDK)

```
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DragonsBackendStack } from '../lib/dragons-backend-stack';
import { DragonsFrontendStack } from '../lib/dragons-frontend-stack';

const app = new cdk.App();
new DragonsBackendStack(app, 'DragonsBackendStack');
new DragonsFrontendStack(app, 'DragonsFrontendStack');

```

To avoid TS errors, change `test/dragonspage.test.ts` -> *Will make some tests in the future, not now.*

```
import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Dragonspage from '../lib/dragons-backend-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Dragonspage.DragonsBackendStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT,
    ),
  );
});

```

If you run `cdk deploy` you will see:

```
Since this app includes more than a single stack, specify which stacks to use (wildcards are supported)
Stacks: DragonsBackendStack DragonsFrontendStack
```

Run `cdk deploy DragonsBackendStack` to create the DynamoDB, lambdas, and API Endpoint... remember to save the API Endpoint.

Add the two initial dragons again to test the frontend:

Add Dragon 1: `curl --header "Content-Type: application/json" --request POST --data @data/dragon1.json <URL_ENDPOINT>`

Add Dragon 2: `curl --header "Content-Type: application/json" --request POST --data @data/dragon2.json <URL_ENDPOINT>`

Open `frontend/src/App.tsx` and change `const apiEndpoint` , then in `frontend/` run `npm run build` to create the files to be sent to the S3 again.

`cdk deploy DragonsFrontendStack` will create the S3 bucket and send the files, the output will be the website URL. Open in the browser to test if everything is ok. Should be.

Ok, now we can start to think again in the task that we have to do, create multiple DynamoDB tables. The code we have is pretty simple:

```
const dragonsTable = new dynamodb.Table(this, 'dragons', {
  partitionKey: { name: 'dragon_name', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

We can be tempted to just copy and modify and then create the four tables we need, but this is not cool to be done. Instead, we will create a JSON with the Table data.

Mary already sent to us the JSON files with the data for each table, you can find here: https://github.com/gugazimmermann/dragonspage/tree/part-2/data - copy the files `dragon_bonus_attack.json`, `dragon_current_power.json`, `dragon_family.json`, and `dragon_stats.json` to `data/` inside the local project. After taking a look at the files we decide that the tables will be like this:

| Table                | Primary Key   | Sort Key |
| -------------------- | ------------- | -------- |
| dragon_stats         | dragon_name   |          |
| dragon_current_power | game_id       |          |
| dragon_bonus_attack  | breath_attack | range    |
| dragon_family        | family        |          |

We know how the tables will be created, so let's just put it in a JSON inside `data/tables.json`:

```
[
  {
    "tableName": "dragon_stats",
    "partitionKey": {
      "name": "dragon_name",
      "type": "STRING"
    }
  },
  {
    "tableName": "dragon_current_power",
    "partitionKey": {
      "name": "game_id",
      "type": "STRING"
    }
  },
  {
    "tableName": "dragon_bonus_attack",
    "partitionKey": {
      "name": "breath_attack",
      "type": "STRING"
    },
    "sortKey": {
      "name": "breath_attack",
      "type": "NUMBER"
    }
  },
  {
    "tableName": "dragon_family",
    "partitionKey": {
      "name": "family",
      "type": "STRING"
    }
  }
]
```

TypeScript will show an error when we try to import the JSON, to solve it add inside `tsconfig.json` right after *"typeRoots": ["./node_modules/@types"],*

```
"moduleResolution": "node",
"resolveJsonModule": true
```

And we can load the JSON data to create the tables, lambda, and API in `lib/dragons-backend.ts`:

```
import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as tablesJson from '../data/tables.json';

export class DragonsBackend extends cdk.Construct {
  public readonly handler: lambda.Function;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const defaultTableParams: dynamodb.TableProps = {
      partitionKey: { name: '', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    };

    const defaultLambdaParams: lambda.FunctionProps = {
      code: lambda.Code.fromAsset('src/lambda'),
      handler: 'dragonsHandler.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
    };

    for (const table of tablesJson) {
      const { tableName, partitionKey, sortKey } = table;
      const tableParams = { ...defaultTableParams, tableName };
      tableParams.partitionKey = {
        name: partitionKey.name,
        type: partitionKey.type === 'S' ? dynamodb.AttributeType.STRING : dynamodb.AttributeType.NUMBER,
      };
      if (sortKey) {
        tableParams.sortKey = {
          name: sortKey.name,
          type: sortKey.type === 'S' ? dynamodb.AttributeType.STRING : dynamodb.AttributeType.NUMBER,
        };
      }
      const dragonsTable = new dynamodb.Table(this, tableName, tableParams);

      if (tableName === 'dragon_stats') {
        const dragonsHandler = new lambda.Function(this, `${tableName}_handler`, {
          ...defaultLambdaParams,
          functionName: `${dragonsTable.tableName}_handler`,
          environment: {
            TABLE_NAME: dragonsTable.tableName,
            PK: JSON.stringify(partitionKey),
            SK: JSON.stringify(sortKey),
          },
        });
        dragonsTable.grantReadWriteData(dragonsHandler);
        new apigateway.LambdaRestApi(this, `${tableName}_endpoint`, {
          restApiName: `${tableName}_endpoint`,
          handler: dragonsHandler,
        });
      }
    }
  }
}

```

We know that for now the site only needs a lambda to get data from dragon_stats, so we will just create API Endpoint and Lambda for this table, and just GetOne and GetAll. Open `src/lambda/dragonsHandler.ts`:

```
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

```

And since we are in the `src/` folder, go to `src/interfaces/dragon.ts` and change to be in the same format that we have now in *dragon_stats* table:

```
export interface IDragon {
  location_neighborhood: string;
  damage: number;
  location_city: string;
  family: string;
  description: string;
  protection: number;
  location_country: string;
  location_state: string;
  dragon_name: string;
}

```

Running `cdk deploy DragonsBackendStack` we will see something like this:

```
Outputs:
DragonsBackendStack.DragonsBackenddragonstatsendpointEndpointA1B2C3D4 = <API_ENDPOINT>
```

It's a good moment to use another tool, the **AWS-CLI** (https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html#cliv2-linux-install) to help us running some code commands in the terminal (don't need to write a script), so let's run `aws dynamodb list-tables` and see the tables:

```
{
  "TableNames": [
    "dragon_bonus_attack",
    "dragon_current_power",
    "dragon_family",
    "dragon_stats"
  ]
}
``` 

And `aws apigateway get-rest-apis` to see the API

```
{
"items": [
  {
    "id": "A1B2C3D4E5",
    "name": "dragon_stats_endpoint",
    "createdDate": "2020-07-28T09:39:05-03:00",
    "apiKeySource": "HEADER",
    "endpointConfiguration": {
        "types": [
            "EDGE"
        ]
    }
  },
  ...
```

But we can't see the API Endpoint? Well, we can, but we need to format it: `https://<RESTAPI_ID>.execute-api.<REGION>.amazonaws.com/<STAGE>/` = https://A1B2C3D4E5.execute-api.us-east-1.amazonaws.com/prod/

If you forgot what region you are using just `run aws configure get region` and the stage in this exercise is always *prod*.

*Tip: if you want to save the output, run `aws apigateway get-rest-apis > rest-apis.json`, this will save the output in the JSON file `rest-apis.json`.* 

Now we need to seed the Items into the tables, a one time job, so it doesn't need to be inside the CDK stack, we can use the CLI. So let's prepare the data to be sent, to use `batch_write_item` we need to create a JSON with this format:

```
{
  "TABLE_NAME": [
    {
      "PutRequest": {
        "Item": {
          "<ITEM_NAME>": { "<ITEM_FORMAT>": "<ITEM_VALUE>" }
        }
      }
    }
  ]
}
```

Do it manually inside `data/data_all.json` or copy from here https://github.com/gugazimmermann/dragonspage/tree/part-2/data/data_all.json.

We now have another problem, BATCH WRITE CAN'T HAVE MORE THAN 25 ITEMS! You are pissed off because you have a lot of work to format all the data into the right format and now you will need to count and slipt all! You think about asking Mary next time to send it to you in the right format… but no, instead we can create a simple script to automate it.
See more here (https://docs.aws.amazon.com/cli/latest/reference/dynamodb/batch-write-item.html)

Create `data/create_data.js` and add **data/*.js** inside `.eslintignore`. Now inside `data/create_data.js` add the script to get the tables and transform the data into the right format.

```
const tables = require('./tables.json');

const finalData = {};
for (let table of tables) {
  finalData[table.tableName] = [];
  const tableData = require(`./${table.tableName}.json`);
  for (let data of tableData) {
    for (let k in data) {
      const type = (typeof data[k] === 'string' || data[k] instanceof String) ? "S" : "N"
      data[k] = { [type] : data[k].toString() }
    }
    const item = { PutRequest: { Item: data } };

    finalData[table.tableName].push(item);
  }
}
console.log(JSON.stringify(finalData, undefined, 2));

```

And just run inside `data/` `node create_data.js > data_to_seed.json`, if you open `data/data_to_seed.json` you will see the data in the right format.

To batch write the data we will use the AWS-SDK, that was installed before in Part-1, so you already have it. Create the file `data/seed_data.js`.

(remember `aws configure get region`? Use it to see the region and change inside the code)

```
const AWS = require('aws-sdk');
const data = require('./data_to_seed.json');
AWS.config.update({ region: '<CHANGE_THE_REGION>' });
const dynamoDB = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) yield arr.slice(i, i + n);
}

function batchWriteItem(params) {
  return Promise.resolve(dynamoDB.batchWriteItem(params).promise())
}

(async () => {
  console.time('HowFastWasThat');
  for (let k in data) {
    if (data[k].length < 25) {
      console.log(await batchWriteItem({ RequestItems: { [k]: data[k] } }));
    } else {
      for (let chunk of [...chunks(data[k], 25)]) {
        console.log(await batchWriteItem({ RequestItems: { [k]: chunk } }));
      }
    }
  }
  console.timeEnd('HowFastWasThat');
})();
``` 

Run `node seed_data.js` and let's see if it worked, `curl <API_ENDPOINT>` must return all the dragons, and `curl <API_ENDPOINT>/Jerichombur` must show data just for *Jerichombur*.

```
{
  "location_neighborhood": "red twig dr",
  "damage": 3,
  "location_city": "las vegas",
  "family": "green",
  "description": "Jerichombur is a dragon of mischief. His earth crushing roar can be heard for miles.",
  "protection": 5,
  "location_country": "usa",
  "location_state": "nevada",
  "dragon_name": "Jerichombur"
}
```

## Frontend

We have a lot of dragons to show, so let's try to show to Mary a better-looking website. Move to `frontend/` and remove Bootstrap, we don't want it anymore `npm uninstall bootstrap react-bootstrap`, now install Material-UI `npm install @material-ui/core @material-ui/lab`.

Open `frontend/public/index.html` and replace the line *<title>* with these two lines:

```
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
<title>Dragons Page</title>
```

Download all the dragon images from https://github.com/gugazimmermann/dragonspage/tree/part-2/images.zip and extract inside `frontend/public/images/`

Create the file `frontend/src/theme.tsx` and add some color to the website:

```
import { red, grey } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: red[900],
    },
    background: {
      default: grey[100],
    },
  },
});

export default theme;
```

Change `frontend/src/index.tsx` to use the theme you just created:

```
import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import App from './App';
import theme from './theme';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
```

Now we can refactor `frontend/src/App.tsx` - Don't forget to change <API_ENDPOINT>.

```
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import Alert from '@material-ui/lab/Alert';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import Dragon from './Dragon';
import { IDragon } from '../../src/interfaces/dragon';

const useStyles = makeStyles((theme) => ({
  heroContent: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(4, 0, 2),
  },
  heroButtons: {
    marginTop: theme.spacing(2),
  },
  select: {
    padding: theme.spacing(2),
  },
  cardGrid: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

function App() {
  const apiEndpoint = '<API_ENDPOINT>';
  const pageTitle = 'Dragons Page';

  const [dragons, setDragons] = useState<Array<IDragon>>([]);
  const [dragonsNames, setDragonsNames] = useState<Array<IDragon>>([]);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [selectDragon, setSelectDragon] = useState<string>('');
  const classes = useStyles();

  useEffect(() => {
    axios
      .get(apiEndpoint)
      .then(({ data }) => setDragonsNames(data))
      .catch(() => setError({ message: 'API ERROR' }));
  }, []);

  useEffect(() => {
    axios
      .get(`${apiEndpoint}/${selectDragon}`)
      .then(({ data }) => setDragons(data))
      .catch(() => setError({ message: 'API ERROR' }));
  }, [selectDragon]);

  return (
    <Container maxWidth="md">
      <AppBar position="relative">
        <Toolbar>
          <Typography variant="h6" color="inherit" noWrap>
            {pageTitle}
          </Typography>
        </Toolbar>
      </AppBar>
      <main>
        <div className={classes.heroContent}>
          <Container maxWidth="sm">
            <Typography component="h1" variant="h4" align="center" color="textPrimary" gutterBottom>
              Welcome to the {pageTitle}
            </Typography>
            <Typography variant="h5" align="center" color="textSecondary" paragraph>
              Please, Choose the dragon card!
            </Typography>
            <div className={classes.heroButtons}>
              <Grid container spacing={2} justify="center">
                <Grid item>
                  <select
                  className={classes.select}
                   value={selectDragon}
                   onChange={(e) => setSelectDragon(e.target.value)}
                  >
                    <option value={''} label={'All'} />
                    {dragonsNames.map((dragon, i) => (
                      <option key={i} value={dragon.dragon_name} label={dragon.dragon_name} />
                    ))}
                  </select>
                </Grid>
              </Grid>
            </div>
          </Container>
        </div>
        <Container className={classes.cardGrid}>
          {error && (
            <Alert variant="filled" severity="error">
              Error to receive data from API!
            </Alert>
          )}
          <Grid container spacing={4}>
            {dragons.map((dragon, i) => (
              <Dragon key={i} dragon={dragon} />
            ))}
          </Grid>
        </Container>
      </main>
    </Container>
  );
}

export default App;

```

And create the component `frontend/src/Dragon.tsx`.

``` 
import React from 'react';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { makeStyles } from '@material-ui/core/styles';
import { grey, blue, green, red } from '@material-ui/core/colors';
import { IDragon } from '../../src/interfaces/dragon';

interface Props {
  dragon: IDragon;
}

const useStyles = makeStyles(() => ({
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardMedia: {
    height: 0,
    paddingTop: '100%', // 16:9
  },
  cardContent: {
    flexGrow: 1,
  },
}));

function Dragon({ dragon }: Props) {
  const classes = useStyles();
  const cardColor = (color: string) => {
    if (color === 'black') return grey[500];
    if (color === 'blue') return blue[100];
    if (color === 'green') return green[200];
    if (color === 'red') return red[200];
    return grey[100];
  };
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card elevation={3} className={classes.card} style={{ backgroundColor: cardColor(dragon.family) }}>
        <CardMedia
          className={classes.cardMedia}
          image={`/images/${dragon.dragon_name}.png`}
          title={dragon.dragon_name}
        />
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h4" component="h2" align="center">
            {dragon.dragon_name}
          </Typography>
          <Typography>{dragon.description}</Typography>
          </CardContent>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">Family</TableCell>
                <TableCell align="center">Damage</TableCell>
                <TableCell align="center">Protection</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell align="center">{dragon.family}</TableCell>
                <TableCell align="center">{dragon.damage}</TableCell>
                <TableCell align="center">{dragon.protection}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
      </Card>
    </Grid>
  );
}

export default Dragon;
```

Build the React Site `npm run build`, go back to `./` and run `cdk deploy DragonsFrontendStack` to deploy the website.

And that's it for now, we can email the link so Mary can see and send more instructions. :)


# Bonus - Custom Domain


We decided to use a custom domain to not have to change the API Endpoint and Site URL every time that for some reason we need to destroy and create the Stack again.

A domain hosted inside AWS Route 53 is needed, I already have one, but if you don't have one, there's no problem skip this part of the exercise and use the generated by CDK. If you want to register a domain, go to https://console.aws.amazon.com/route53/home#DomainRegistration

First, we need to install some dependencies: `npm install @aws-cdk/aws-route53 @aws-cdk/aws-route53-targets @aws-cdk/aws-certificatemanager @aws-cdk/aws-cloudfront` ... and this simple step can become trick and start to return a lot of errors when you run `npm run watch`. The reason is that the version of the modules can be different from `@aws-cdk/core` - For me when writing this exercise the version of Core was 1.54.0 and the new modules 1.55.0 ... but we can solve it running `npx npm-check-updates -u` to update all the dependencies, then `npm install` again, and is a good thing close and re-open VSCode.

Another problem that I faced was the region, all the exercise I was using `us-east-2`, but to generate the certificate I received a message that needs to be in `us-east-1`. So you can destroy the stacks and change the region inside `~/.aws/config` to be `us-east-1`.

If during the exercise you need to destroy the Stacks and start again we may see an error in the CloudFormation, this can be because some resources inside Route 53, DynamoDB Domain, CloudFront, and others, fail to delete and you will need to open the console https://console.aws.amazon.com/ search the error you saw in the terminal and deleted manually. You may need to delete the CloudFormation too or run destroy again.

Since now we will use the same bucket every time, CloudFormation can be stuck for a long time if you delete the bucket (in a destroy) and try to create right after… buckets have unique names globally, and AWS will protect the names for a while.

The first time you try to deploy probably will see a warning about cdk bootstrap, no worries, just run `cdk bootstrap`.

Well… I think that is it, and have these problems is good to understand better the AWS resources and figure out how to solve them.

Ok, now we have the dependencies, let's start… We decided what domain to use, `pocz.io` (for you, of course, will be another), the site will run in `wwww.pocz.io` and the API in `api.pocz.io`. So we need to pass this info inside `./cdk.json`.

```
{
    "app": "npx ts-node bin/dragonspage.ts",
    "context": {
        "@aws-cdk/core:enableStackNameDuplicates": "true",
        "aws-cdk:enableDiffNoFail": "true",
        "domain": "pocz.io",
        "subdomain": "www",
        "apisubdomain": "api"
    }
}
```

In `bin/dragonspage.ts` we need to pass your account and region as an environment to the stack, take the opportunity and pass to backend and frontend so we don't need to do it later.

```
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DragonsBackendStack } from '../lib/dragons-backend-stack';
import { DragonsFrontendStack } from '../lib/dragons-frontend-stack';

const app = new cdk.App();
new DragonsBackendStack(app, 'DragonsBackendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
new DragonsFrontendStack(app, 'DragonsFrontendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

Inside `lib/dragons-backend-stack.ts` we will pass the CDK context to the Construct.

```
import * as cdk from '@aws-cdk/core';
import { DragonsBackend } from './dragons-backend';

export class DragonsBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DragonsBackend(this, 'DragonsBackend', {
      domainName: this.node.tryGetContext('domain'),
      apiSubDomain: this.node.tryGetContext('apisubdomain'),
    });
  }
}

```

Finally in `lib/dragons-backend.ts` we can start to work.

First, we need to receive the CDK context as props, but we need an Interface for Typescript, with this information when can get the Route 53 hosted zone and create the full API URL. We need a certificate, create the API Domain and attach this certificate, and add a Base Path for the API… this is important because we can use the same domain again for other APIs, so we will use the table name as a path to make it easy, the final URL will be `https://api.pocz.io/dragon_stats`... and to complete we need to tell Route 53 that `api.pocz.io` exist.

```
import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as tablesJson from '../data/tables.json';
import * as targets from '@aws-cdk/aws-route53-targets/lib';

export interface IStaticSiteProps {
  domainName: string;
  apiSubDomain: string;
}
export class DragonsBackend extends cdk.Construct {
  public readonly handler: lambda.Function;

  constructor(scope: cdk.Construct, id: string, props: IStaticSiteProps) {
    super(scope, id);

    const defaultTableParams: dynamodb.TableProps = {
      partitionKey: { name: '', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    };

    const defaultLambdaParams: lambda.FunctionProps = {
      code: lambda.Code.fromAsset('src/lambda'),
      handler: 'dragonsHandler.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
    };

    for (const table of tablesJson) {
      const { tableName, partitionKey, sortKey } = table;
      const tableParams = { ...defaultTableParams, tableName };
      tableParams.partitionKey = {
        name: partitionKey.name,
        type: partitionKey.type === 'S' ? dynamodb.AttributeType.STRING : dynamodb.AttributeType.NUMBER,
      };
      if (sortKey) {
        tableParams.sortKey = {
          name: sortKey.name,
          type: sortKey.type === 'S' ? dynamodb.AttributeType.STRING : dynamodb.AttributeType.NUMBER,
        };
      }
      const dragonsTable = new dynamodb.Table(this, tableName, tableParams);

      if (tableName === 'dragon_stats') {
        const dragonsHandler = new lambda.Function(this, `${tableName}_handler`, {
          ...defaultLambdaParams,
          functionName: `${dragonsTable.tableName}_handler`,
          environment: {
            TABLE_NAME: dragonsTable.tableName,
            PK: JSON.stringify(partitionKey),
            SK: JSON.stringify(sortKey),
          },
        });
        dragonsTable.grantReadWriteData(dragonsHandler);

        const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
        const apiDomain = props.apiSubDomain + '.' + props.domainName;

        const certificate = new acm.DnsValidatedCertificate(this, 'ApiCertificate', {
          domainName: apiDomain,
          hostedZone: zone,
          region: process.env.CDK_DEFAULT_REGION,
        });

        const api = new apigateway.LambdaRestApi(this, `${tableName}_endpoint`, {
          restApiName: `${tableName}_endpoint`,
          handler: dragonsHandler,
        });

        const domain = new apigateway.DomainName(this, 'ApiDomain', {
          domainName: apiDomain,
          certificate: certificate,
          endpointType: apigateway.EndpointType.EDGE,
          securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        });

        domain.addBasePathMapping(api, { basePath: tableName });

        new route53.ARecord(this, 'ApiDomainAliasRecord', {
          recordName: apiDomain,
          target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(domain)),
          zone,
        });
      }
    }
  }
}

```

After deploy you will need to wait for some time, and if you hit the endpoint `curl https://api.pocz.io/dragon_stats` and see `[ ]` you know that need to send the data to DynamoDB again.

Now the frontend, first open `frontend/src/App.tsx` and change the API Endpoint `const apiEndpoint = 'https://api.pocz.io/dragon_stats';` to not forget to do it later. We can also run `npm run build` to re-create the React Website.

Start the changes in the Frontend passing the CDK context in `lib/dragons-frontend-stack.ts`

```
import * as cdk from '@aws-cdk/core';
import { DragonsFrontend } from './dragons-frontend';

export class DragonsFrontendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DragonsFrontend(this, 'DragonsFrontend', {
      domainName: this.node.tryGetContext('domain'),
      siteSubDomain: this.node.tryGetContext('subdomain'),
    });
  }
}

```

In `lib/dragons-frontend.ts` receive the CDK context as props, create the TS Interface, get the Route 53 hosted zone, and create the site URL. We will add a name to the bucket, so it will not change every time, create a certificate to the domain (so this can be an https and not throw security warnings), a CloudFront to do the distribution of the website content, and in the end tell Route 53 that `www.pocz.io` exists.

```
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as targets from '@aws-cdk/aws-route53-targets/lib';

export interface IStaticSiteProps {
  domainName: string;
  siteSubDomain: string;
}
export class DragonsFrontend extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: IStaticSiteProps) {
    super(scope, id);

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
    const siteDomain = props.siteSubDomain + '.' + props.domainName;

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const certificateArn = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: siteDomain,
      hostedZone: zone,
      region: process.env.CDK_DEFAULT_REGION,
    }).certificateArn;

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [siteDomain],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    });

    new s3Deployment.BucketDeployment(this, 'DeploySite', {
      sources: [s3Deployment.Source.asset('frontend/build')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'Site', { value: 'https://' + siteDomain });
  }
}

```

Now you can deploy the frontend, open https://www.pocz.io and see the site running.


#### The End!

To not keep the resources inside AWS (and not pay for it), we can destroy the CloudFormation: `cdk destroy DragonsBackendStack DragonsFrontendStack`


# DRAGONS PAGE

RUNNING CODE: https://www.pocz.io/

LINKEDIN: 

**DRAGONS PAGE** changes the exercises of the course **Amazon DynamoDB: Building NoSQL Database-Driven Applications** https://www.coursera.org/learn/dynamodb-nosql-database-driven-apps/home/welcome to be done using the AWS CDK. Thanks to Seph Robinson, Morgan Willis, and Rick H for the course. (I also recommend the specialization AWS Fundamentals: Going Cloud-Native that I did before.)
