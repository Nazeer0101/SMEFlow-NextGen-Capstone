import React from "react";import{describe,it,expect}from"vitest";import{render,screen}from"@testing-library/react";
function TestHeader(){return <header><h1>SMEFlow</h1><p>Digital Operations Management Platform</p></header>}
describe("SMEFlow interface",()=>{it("renders the project identity",()=>{render(<TestHeader/>);expect(screen.getByRole("heading",{name:"SMEFlow"})).toBeInTheDocument();expect(screen.getByText("Digital Operations Management Platform")).toBeInTheDocument()})});
