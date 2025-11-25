import React from "react";
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItem, Card, CardContent } from "@mui/material";

function Home() {
return ( <Box display="flex">

```
  {/* Sidebar */}
  <Drawer
    variant="permanent"
    anchor="left"
    PaperProps={{ style: { width: 240 } }}
  >
    <List>
      <ListItem>Dashboard</ListItem>
      <ListItem>Monitoring Load Cell</ListItem>
      <ListItem>Pilih Resep</ListItem>
      <ListItem>Riwayat</ListItem>
    </List>
  </Drawer>

  {/* Main Content */}
  <Box flexGrow={1}>
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6">
          Sistem Pencampur Pakan Ayam
        </Typography>
      </Toolbar>
    </AppBar>

    <Box p={3}>
      <Card>
        <CardContent>
          <Typography variant="h6">
            Status mesin dan berat bahan masuk
          </Typography>
        </CardContent>
      </Card>
    </Box>
  </Box>

</Box>
```

);
}

export default Home;
