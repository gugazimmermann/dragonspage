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