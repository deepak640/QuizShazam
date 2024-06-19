import axios from "axios";
import { useEffect, useState } from "react";

const useAPI = (pathURL, token = null) => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const res = await axios.get(pathURL, config);
        setData(res.data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError(true);
      }
    })();
  }, [token]);

  return [data, error, loading];
};

export default useAPI;
