package com.devcommandcenter.model

import kotlinx.serialization.Serializable

@Serializable
data class Project(
    val id: String,
    val userId: String,
    val name: String,
    val description: String? = null,
    val tags: List<String> = emptyList(),
    val gitRepoUrl: String? = null,
    val gitAccountEmail: String? = null,
    val services: List<DeploymentService> = emptyList(),
    val frontendPlatform: String? = null,
    val frontendAccountEmail: String? = null,
    val frontendUrl: String? = null,
    val backendPlatform: String? = null,
    val backendAccountEmail: String? = null,
    val backendUrl: String? = null,
    val localRunbook: String? = null,
    val encryptedTestCredentials: String? = null,
    val linkedAccountId: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
