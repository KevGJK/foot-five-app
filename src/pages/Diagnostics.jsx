import { useState } from "react";

import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import { testBackend } from "../services/functions";

export default function Diagnostics(){

    const [loading,setLoading]=useState(false);

    const [result,setResult]=useState(null);

    const [error,setError]=useState(null);

    async function runTest(){

        setLoading(true);

        setError(null);

        setResult(null);

        try{

            const response = await testBackend();

            setResult(response);

        }

        catch(e){

            console.error(e);

            setError(e.message);

        }

        finally{

            setLoading(false);

        }

    }

    return(

        <Page>

            <h1 className="page-title">

                🧪 Diagnostics

            </h1>

            <Card>

                <Button

                    onClick={runTest}

                    disabled={loading}

                >

                    {loading ? "Test en cours..." : "Tester le backend"}

                </Button>

                {

                    result &&

                    <pre
                        style={{

                            marginTop:"20px",

                            whiteSpace:"pre-wrap",

                            wordBreak:"break-word",

                            fontSize:"14px"

                        }}
                    >

{JSON.stringify(result,null,2)}

                    </pre>

                }

                {

                    error &&

                    <div
                        style={{

                            marginTop:"20px",

                            color:"#ef4444"

                        }}
                    >

                        {error}

                    </div>

                }

            </Card>

        </Page>

    );

}