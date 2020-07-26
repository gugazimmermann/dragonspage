import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { IDragon } from '../../src/interfaces/dragon';

function App() {
  const apiEndpoint = 'https://dq2w4s564i.execute-api.us-east-2.amazonaws.com/prod';
  const [dragons, setDragons] = useState<Array<IDragon>>([]);
  const [error, setError] = useState<{ message: string } | null>(null);

  useEffect(() => {
    axios
      .get(apiEndpoint)
      .then(({ data }) => {
        setDragons(data);
      })
      .catch((err) => {
        setError({ message: 'API ERROR' });
      });
  }, []);

  return (
    <Container fluid className="p-3">
      <Jumbotron>
        <h1 className="header text-center">Welcome to Dragons Page</h1>
      </Jumbotron>
      <Form.Control as="select">
        <option>All</option>
        <option>...</option>
      </Form.Control>
      <br />
      {error && <Alert variant="danger">{error.message}</Alert>}
      <Row>
        {dragons &&
          dragons.map((dragon, i) => (
            <Col key={i} xs="4">
              <Card>
                <Card.Title className="mt-2 font-weight-bold text-center">{dragon.dragon_name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted text-center">{dragon.dragon_type}</Card.Subtitle>
                <Table striped bordered hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="text-center">Att</th>
                      <th className="text-center">Def</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{dragon.description}</td>
                      <td className="text-center">{dragon.attack}</td>
                      <td className="text-center">{dragon.defense}</td>
                    </tr>
                  </tbody>
                </Table>
                <Card.Img variant="top" src={`${dragon.dragon_name}.png`} />
              </Card>
            </Col>
          ))}
      </Row>
    </Container>
  );
}

export default App;
