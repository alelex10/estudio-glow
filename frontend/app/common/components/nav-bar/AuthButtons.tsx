import { Link } from "react-router";
import { Button } from "../Button";
import { AUTH } from "../../constants/rute-client";

export default function AuthButtons() {
  return (
    <>
      <Link to={AUTH.REGISTER()}>
        <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary-800">
          Registrarse
        </Button>
      </Link>
      <Link to={AUTH.LOGIN()}>
        <Button className="bg-primary-100">Login</Button>
      </Link>
    </>
  );
}
