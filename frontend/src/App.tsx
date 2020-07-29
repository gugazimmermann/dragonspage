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
  const apiEndpoint = 'https://api.pocz.io/dragon_stats';
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
