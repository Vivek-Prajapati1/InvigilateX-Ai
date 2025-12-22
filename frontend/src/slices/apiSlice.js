import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';

// Use Render backend in production, proxy in development
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.PROD ? 'https://invigilatex-ai.onrender.com' : '/',
  credentials: 'include',
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['User'],
  // it like a prent to other api
  // it a build in builder
  endpoints: (builder) => ({}),
});
