import React from "react";
import { TextField, Button, Card, CardContent, Typography } from "@mui/material";

function Login() {
return (
<div style={{
minHeight: "100vh",
display: "flex",
alignItems: "center",
justifyContent: "center",
background: "#f5f5f5",
}}>
<Card style={{ width: 380, padding: "20px" }}> <CardContent>
<Typography variant="h5" style={{ marginBottom: 20 }}>
Login Sistem </Typography>

```
      <TextField
        fullWidth
        label="Username"
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        type="password"
        label="Password"
        variant="outlined"
        margin="normal"
      />

      <Button
        fullWidth
        variant="contained"
        color="primary"
        style={{ marginTop: 20 }}
      >
        Login
      </Button>
    </CardContent>
  </Card>
</div>


);
}

export default Login;
