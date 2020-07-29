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
