import axios from "axios";
import { useEffect, useState } from "react";
const useAPI = (pathURL, token = null) => {
  const { VITE_REACT_API_URL } = import.meta.env;
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
        const res = await axios.get(`${VITE_REACT_API_URL}/${pathURL}`, config);
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
