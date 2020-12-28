import React from "react";
import Head from "next/head";

const CustomApp = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Next Iron Auth</title>
      </Head>

      <Component {...pageProps} />
    </>
  );
};

export default CustomApp;
